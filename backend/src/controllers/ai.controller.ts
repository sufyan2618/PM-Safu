import type { Request, Response } from "express";
import { Types } from "mongoose";
import Fuse from "fuse.js";
import { env } from "../config/env";
import { ClientModel } from "../models/client.model";
import { InvoiceModel } from "../models/invoice.model";
import { CompanyModel } from "../models/company.model";
import { PayrollModel } from "../models/payroll.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { aiEnabled, chatJSON, chatText } from "../lib/ai/groqClient";
import { cacheKey, hashInput, withCache } from "../lib/ai/cache";
import {
  INVOICE_DESCRIBE_SYSTEM,
  INVOICE_EXTRACT_SYSTEM,
  PAYROLL_CHAT_SYSTEM,
  PAYROLL_SUMMARY_SYSTEM,
} from "../lib/ai/prompts";
import {
  computeAnomalies,
  departmentBreakdown,
  findPreviousRun,
  loadRunWithSlips,
} from "../lib/ai/payrollAnalysis";
import { redis } from "../config/redis";
import { PayrollStatus } from "../config/constants";

function companyId(req: Request): string {
  return String(req.companyId);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86_400_000);
}

// ── AI capability flag ───────────────────────────────────────────────────────

export const aiStatus = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, { data: { enabled: aiEnabled(), model: env.GROQ_MODEL } });
});

// ── Invoice: natural language -> structured draft ────────────────────────────

interface ExtractedInvoice {
  clientQuery: string | null;
  items: { description: string; quantity: number; rate: number; taxRate: number | null }[];
  taxPercent: number | null;
  dueInDays: number | null;
  dueDate: string | null;
  notes: string | null;
  missingFields: string[];
}

interface LeanClient {
  _id: Types.ObjectId;
  name: string;
  companyNameOfClient?: string;
}

type ClientResolution =
  | { confidence: "high"; client: LeanClient }
  | { confidence: "medium"; candidates: LeanClient[] }
  | { confidence: "none"; candidates: [] };

function resolveClient(query: string, clients: LeanClient[]): ClientResolution {
  const fuse = new Fuse(clients, {
    keys: ["name", "companyNameOfClient"],
    threshold: 0.5,
    includeScore: true,
  });
  const results = fuse.search(query);
  const best = results[0];
  if (!best) return { confidence: "none", candidates: [] };

  const bestScore = best.score ?? 1;
  const secondScore = results[1]?.score ?? 1;
  // High confidence: a strong match that is clearly better than the runner-up.
  if (bestScore <= 0.2 && (results.length === 1 || secondScore - bestScore > 0.15)) {
    return { confidence: "high", client: best.item };
  }
  return { confidence: "medium", candidates: results.slice(0, 4).map((r) => r.item) };
}

export const invoiceDraft = asyncHandler(async (req: Request, res: Response) => {
  const cid = companyId(req);
  const { prompt, clientId, dueDate } = req.body as {
    prompt: string;
    clientId?: string;
    dueDate?: string;
  };

  // 1. Extract structured intent (cached by prompt so repeated requests don't re-bill Groq).
  const extractKey = cacheKey("invoice-extract", cid, hashInput({ prompt }));
  const { value: extracted } = await withCache(extractKey, async () => {
    const { data } = await chatJSON<ExtractedInvoice>({
      model: env.GROQ_MODEL,
      messages: [
        { role: "system", content: INVOICE_EXTRACT_SYSTEM },
        { role: "user", content: prompt },
      ],
    });
    return data;
  });

  const clients = (await ClientModel.find({ companyId: cid })
    .select("name companyNameOfClient")
    .lean()) as unknown as LeanClient[];

  const questions: {
    id: string;
    type: string;
    prompt: string;
    options?: { id: string; label: string; description?: string }[];
  }[] = [];

  // 2. Resolve the client.
  let resolvedClientId: string | null = null;
  let resolvedClientName: string | null = null;

  if (clientId) {
    const chosen = clients.find((c) => String(c._id) === clientId);
    if (chosen) {
      resolvedClientId = String(chosen._id);
      resolvedClientName = chosen.name;
    }
  }

  if (!resolvedClientId) {
    if (extracted.clientQuery) {
      const resolution = resolveClient(extracted.clientQuery, clients);
      if (resolution.confidence === "high") {
        resolvedClientId = String(resolution.client._id);
        resolvedClientName = resolution.client.name;
      } else if (resolution.confidence === "medium") {
        questions.push({
          id: "client",
          type: "client_disambiguation",
          prompt: `Which client did you mean by "${extracted.clientQuery}"?`,
          options: resolution.candidates.map((c) => ({
            id: String(c._id),
            label: c.name,
            description: c.companyNameOfClient,
          })),
        });
      } else {
        questions.push({
          id: "client",
          type: "client_select",
          prompt: `No client matching "${extracted.clientQuery}" was found. Pick an existing client or create a new one.`,
        });
      }
    } else {
      questions.push({
        id: "client",
        type: "client_select",
        prompt: "Which client is this invoice for?",
      });
    }
  }

  // 3. Build line items, reusing historical rates where the model didn't supply a price.
  const items = (extracted.items ?? []).map((item) => ({
    description: item.description,
    quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
    unitPrice: Number.isFinite(item.rate) && item.rate > 0 ? item.rate : 0,
    taxRate: item.taxRate ?? extracted.taxPercent ?? 0,
  }));

  if (resolvedClientId && items.some((i) => i.unitPrice === 0)) {
    const lastInvoice = await InvoiceModel.findOne({ companyId: cid, clientId: resolvedClientId })
      .sort("-issueDate")
      .select("items")
      .lean();
    const history = lastInvoice?.items ?? [];
    if (history.length > 0) {
      const histFuse = new Fuse(history, { keys: ["description"], threshold: 0.4, includeScore: true });
      for (const item of items) {
        if (item.unitPrice > 0) continue;
        const match = histFuse.search(item.description)[0];
        if (match && (match.score ?? 1) <= 0.4) {
          item.unitPrice = match.item.unitPrice;
          if (!item.taxRate) item.taxRate = match.item.taxRate ?? 0;
        }
      }
    }
  }

  const hasUsableItems = items.length > 0 && items.some((i) => i.unitPrice > 0);
  if (!hasUsableItems) {
    questions.push({
      id: "items",
      type: "items",
      prompt:
        "I couldn't work out the line items or their prices. Add the service, quantity and price to your request, then try again.",
    });
  }

  // 4. Resolve a due date (defaults to the company payment terms; never blocks the draft).
  let dueDateStr: string | null = dueDate ?? extracted.dueDate ?? null;
  if (!dueDateStr && extracted.dueInDays && extracted.dueInDays > 0) {
    dueDateStr = toIsoDate(addDays(new Date(), extracted.dueInDays));
  }
  if (!dueDateStr) {
    const company = await CompanyModel.findById(cid).select("invoiceSettings.defaultPaymentTermsDays").lean();
    const terms = company?.invoiceSettings?.defaultPaymentTermsDays ?? 14;
    dueDateStr = toIsoDate(addDays(new Date(), terms));
  }

  return sendSuccess(res, {
    data: {
      status: questions.length > 0 ? "needs_input" : "ready",
      draft: {
        clientId: resolvedClientId,
        clientName: resolvedClientName,
        dueDate: dueDateStr,
        notes: extracted.notes,
        terms: null,
        items,
      },
      questions,
      meta: { model: env.GROQ_MODEL },
    },
  });
});

// ── Invoice: line-item description generation ────────────────────────────────

export const invoiceDescribe = asyncHandler(async (req: Request, res: Response) => {
  const cid = companyId(req);
  const { name, hours, context } = req.body as { name: string; hours?: number; context?: string };

  const key = cacheKey("invoice-describe", cid, hashInput({ name, hours, context }));
  const { value } = await withCache(key, async () => {
    const userParts = [`Item: ${name}`];
    if (hours) userParts.push(`Hours: ${hours}`);
    if (context) userParts.push(`Context: ${context}`);
    const { text } = await chatText({
      model: env.GROQ_MODEL_FAST,
      temperature: 0.6,
      messages: [
        { role: "system", content: INVOICE_DESCRIBE_SYSTEM },
        { role: "user", content: userParts.join("\n") },
      ],
    });
    return { description: text.trim() };
  });

  return sendSuccess(res, { data: value });
});

// ── Payroll: run insights (summary + anomalies) ──────────────────────────────

export const payrollInsights = asyncHandler(async (req: Request, res: Response) => {
  const cid = companyId(req);
  const runId = String(req.params.id);
  const refresh = Boolean((req.query as { refresh?: boolean }).refresh);

  const data = await loadRunWithSlips(cid, runId);
  if (!data) throw ApiError.notFound("Payroll run not found");

  const prevRun = await findPreviousRun(cid, data.run);
  const prevData = prevRun ? await loadRunWithSlips(cid, String(prevRun._id)) : null;
  const prevSlips = prevData?.slips ?? [];

  const anomalies = computeAnomalies(data.slips, prevSlips);
  const departments = departmentBreakdown(data.slips);

  const currentNet = data.run.totalNet;
  const prevNet = prevRun?.totalNet ?? 0;
  const changeAmount = currentNet - prevNet;
  const changePct = prevNet > 0 ? Math.round((changeAmount / prevNet) * 1000) / 10 : null;

  const comparison = {
    period: data.run.period,
    previousPeriod: prevRun?.period ?? null,
    totalNet: currentNet,
    totalGross: data.run.totalGross,
    totalDeductions: data.run.totalDeductions,
    employeeCount: data.run.employeeCount,
    previousTotalNet: prevRun ? prevNet : null,
    changeAmount: prevRun ? changeAmount : null,
    changePct,
  };

  const analysisPayload = { comparison, departments, anomalies };

  let summary: string | null = null;
  let model: string | null = null;
  let generatedAt: string | null = null;
  let cached = false;

  if (aiEnabled()) {
    const key = cacheKey("payroll-insights", cid, runId, hashInput(analysisPayload));
    if (refresh) {
      try {
        await redis.del(key);
      } catch {
        /* ignore cache errors */
      }
    }
    const result = await withCache(key, async () => {
      const { data: summaryData } = await chatJSON<{ summary: string }>({
        model: env.GROQ_MODEL,
        messages: [
          { role: "system", content: PAYROLL_SUMMARY_SYSTEM },
          { role: "user", content: JSON.stringify(analysisPayload) },
        ],
      });
      return { summary: summaryData.summary, model: env.GROQ_MODEL, generatedAt: new Date().toISOString() };
    });
    summary = result.value.summary;
    model = result.value.model;
    generatedAt = result.value.generatedAt;
    cached = result.cached;
  }

  return sendSuccess(res, {
    data: { aiEnabled: aiEnabled(), summary, anomalies, comparison, departments, model, generatedAt, cached },
  });
});

// ── Payroll: grounded chat copilot ───────────────────────────────────────────

async function buildPayrollContext(cid: string, payrollId?: string) {
  const company = await CompanyModel.findById(cid).select("currency").lean();

  // Include every run except cancelled ones so the copilot still has data when runs
  // are only drafted (not finalized yet) — otherwise it wrongly reports "no data".
  const recentRuns = await PayrollModel.find({
    companyId: cid,
    status: { $ne: PayrollStatus.CANCELLED },
  })
    .sort({ "period.year": -1, "period.month": -1 })
    .limit(12)
    .lean();

  const focusRunId = payrollId ?? (recentRuns[0] ? String(recentRuns[0]._id) : null);
  const focus = focusRunId ? await loadRunWithSlips(cid, focusRunId) : null;
  const previous = focus ? await findPreviousRun(cid, focus.run) : null;

  return {
    currency: company?.currency ?? "USD",
    recentRuns: recentRuns
      .map((r) => ({
        period: `${r.period.year}-${String(r.period.month).padStart(2, "0")}`,
        totalGross: r.totalGross,
        totalNet: r.totalNet,
        totalDeductions: r.totalDeductions,
        employeeCount: r.employeeCount,
      }))
      .reverse(),
    focusRun: focus
      ? {
          period: `${focus.run.period.year}-${String(focus.run.period.month).padStart(2, "0")}`,
          totalNet: focus.run.totalNet,
          totalGross: focus.run.totalGross,
          employeeCount: focus.run.employeeCount,
          departments: departmentBreakdown(focus.slips),
        }
      : null,
    previousRun: previous
      ? {
          period: `${previous.period.year}-${String(previous.period.month).padStart(2, "0")}`,
          totalNet: previous.totalNet,
          employeeCount: previous.employeeCount,
        }
      : null,
  };
}

export const payrollChat = asyncHandler(async (req: Request, res: Response) => {
  const cid = companyId(req);
  const { messages, payrollId } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
    payrollId?: string;
  };

  const context = await buildPayrollContext(cid, payrollId);

  const key = cacheKey("payroll-chat", cid, hashInput({ context, messages }));
  const { value, cached } = await withCache(
    key,
    async () => {
      const { text } = await chatText({
        model: env.GROQ_MODEL_FAST,
        temperature: 0.4,
        messages: [
          { role: "system", content: PAYROLL_CHAT_SYSTEM },
          { role: "system", content: `Context snapshot (JSON):\n${JSON.stringify(context)}` },
          ...messages,
        ],
      });
      return { message: text.trim() };
    },
    3600,
  );

  return sendSuccess(res, { data: { ...value, cached } });
});
