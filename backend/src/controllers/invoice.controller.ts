import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { EMAIL_JOBS, InvoiceStatus, PDF_JOBS, UserType } from "../config/constants";
import { env } from "../config/env";
import { CompanyModel } from "../models/company.model";
import { ClientModel } from "../models/client.model";
import { InvoiceModel, type IInvoice } from "../models/invoice.model";
import { InvoiceTemplateModel } from "../models/invoiceTemplate.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";
import { computeInvoiceTotals } from "../utils/invoiceCalculator";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber";
import { generateToken } from "../utils/generateSlug";
import { formatCurrency } from "../utils/format";
import { buildInvoiceRenderData } from "../lib/pdf/buildInvoiceRenderData";
import { generateInvoicePdf } from "../lib/pdf/generateInvoicePdf";
import { enqueueEmail } from "../queues/email.queue";
import { enqueuePdf } from "../queues/pdf.queue";
import { recordAudit } from "../utils/audit";

function applyPaymentStatus(invoice: IInvoice) {
  invoice.amountDue = Math.max(invoice.grandTotal - invoice.amountPaid, 0);
  if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.DRAFT) return;
  if (invoice.amountDue <= 0) {
    invoice.status = InvoiceStatus.PAID;
  } else if (invoice.amountPaid > 0) {
    invoice.status = InvoiceStatus.PARTIALLY_PAID;
  }
}

async function syncClientTotals(companyId: Types.ObjectId, clientId: Types.ObjectId) {
  const agg = await InvoiceModel.aggregate<{ _id: null; invoiced: number; outstanding: number }>([
    {
      $match: {
        companyId,
        clientId,
        status: { $ne: InvoiceStatus.CANCELLED },
      },
    },
    {
      $group: {
        _id: null,
        invoiced: { $sum: "$grandTotal" },
        outstanding: { $sum: "$amountDue" },
      },
    },
  ]);
  const totals = agg[0];
  await ClientModel.updateOne(
    { _id: clientId },
    { $set: { totalInvoiced: totals?.invoiced ?? 0, totalOutstanding: totals?.outstanding ?? 0 } },
  );
}

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { status, clientId, dateFrom, dateTo, search } = req.query as {
    status?: InvoiceStatus;
    clientId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (status) filter.status = status;
  if (clientId) filter.clientId = clientId;
  if (search) filter.invoiceNumber = { $regex: search, $options: "i" };
  if (dateFrom || dateTo) {
    filter.issueDate = {
      ...(dateFrom ? { $gte: dateFrom } : {}),
      ...(dateTo ? { $lte: dateTo } : {}),
    };
  }

  const [invoices, total] = await Promise.all([
    InvoiceModel.find(filter).sort(sort).skip(skip).limit(limit).populate("clientId", "name email"),
    InvoiceModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: invoices, meta: buildMeta(total, page, limit) });
});

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.companyId!;
  const company = await CompanyModel.findById(companyId);
  if (!company) throw ApiError.notFound("Company not found");

  const client = await ClientModel.findOne({ _id: req.body.clientId, companyId });
  if (!client) throw ApiError.notFound("Client not found");

  // Resolve template: explicit, else company default, else any template.
  let templateId = req.body.templateId ?? company.invoiceSettings.defaultTemplateId?.toString();
  if (templateId) {
    const template = await InvoiceTemplateModel.findOne({ _id: templateId, companyId });
    if (!template) throw ApiError.badRequest("Invalid template");
  } else {
    const fallback = await InvoiceTemplateModel.findOne({ companyId, isArchived: false });
    if (!fallback) throw ApiError.badRequest("No invoice template found. Create one first.");
    templateId = fallback._id.toString();
  }

  const shippingFee = req.body.shippingFee ?? 0;
  const { items, subTotal, totalTax, totalDiscount, grandTotal } = computeInvoiceTotals(
    req.body.items,
    shippingFee,
  );

  const issueDate: Date = req.body.issueDate ?? new Date();
  const dueDate: Date =
    req.body.dueDate ??
    new Date(issueDate.getTime() + company.invoiceSettings.defaultPaymentTermsDays * 86400000);

  const { invoiceNumber } = await generateInvoiceNumber(companyId as never, company.invoiceSettings);

  const invoice = await InvoiceModel.create({
    companyId,
    invoiceNumber,
    clientId: client._id,
    templateId,
    status: InvoiceStatus.DRAFT,
    issueDate,
    dueDate,
    items,
    subTotal,
    totalTax,
    totalDiscount,
    shippingFee,
    grandTotal,
    amountPaid: 0,
    amountDue: grandTotal,
    currency: req.body.currency?.toUpperCase() ?? company.currency,
    notes: req.body.notes,
    termsAndConditions: req.body.termsAndConditions,
    poNumber: req.body.poNumber,
    createdBy: req.user?.sub,
  });

  await syncClientTotals(companyId as never, client._id);

  return sendCreated(res, { message: "Invoice created", data: invoice });
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate("clientId", "name email phone billingAddress")
    .populate("templateId", "name baseTheme");
  if (!invoice) throw ApiError.notFound("Invoice not found");
  return sendSuccess(res, { data: invoice });
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!invoice) throw ApiError.notFound("Invoice not found");

  if (invoice.status !== InvoiceStatus.DRAFT) {
    // Once sent, only a limited set of metadata fields may change.
    const allowed = ["notes", "termsAndConditions", "dueDate", "poNumber"] as const;
    for (const key of allowed) {
      if (req.body[key] !== undefined) (invoice as never as Record<string, unknown>)[key] = req.body[key];
    }
  } else {
    if (req.body.clientId) {
      const client = await ClientModel.findOne({ _id: req.body.clientId, companyId: req.companyId });
      if (!client) throw ApiError.notFound("Client not found");
      invoice.clientId = client._id;
    }
    if (req.body.templateId) {
      const template = await InvoiceTemplateModel.findOne({
        _id: req.body.templateId,
        companyId: req.companyId,
      });
      if (!template) throw ApiError.badRequest("Invalid template");
      invoice.templateId = template._id;
    }
    if (req.body.items) {
      const shippingFee = req.body.shippingFee ?? invoice.shippingFee;
      const totals = computeInvoiceTotals(req.body.items, shippingFee);
      invoice.items = totals.items;
      invoice.subTotal = totals.subTotal;
      invoice.totalTax = totals.totalTax;
      invoice.totalDiscount = totals.totalDiscount;
      invoice.shippingFee = shippingFee;
      invoice.grandTotal = totals.grandTotal;
      invoice.amountDue = totals.grandTotal - invoice.amountPaid;
    } else if (req.body.shippingFee !== undefined) {
      const totals = computeInvoiceTotals(
        invoice.items.map((item) => ({ ...item })),
        req.body.shippingFee,
      );
      invoice.shippingFee = req.body.shippingFee;
      invoice.grandTotal = totals.grandTotal;
      invoice.amountDue = totals.grandTotal - invoice.amountPaid;
    }
    for (const key of ["issueDate", "dueDate", "notes", "termsAndConditions", "poNumber", "currency"] as const) {
      if (req.body[key] !== undefined) (invoice as never as Record<string, unknown>)[key] = req.body[key];
    }
  }

  invoice.lastUpdatedBy = req.user?.sub as never;
  await invoice.save();
  await syncClientTotals(invoice.companyId, invoice.clientId);

  return sendSuccess(res, { message: "Invoice updated", data: invoice });
});

export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status !== InvoiceStatus.DRAFT) {
    throw ApiError.badRequest("Only draft invoices can be deleted. Cancel it instead.");
  }

  await invoice.deleteOne();
  await syncClientTotals(invoice.companyId, invoice.clientId);
  return sendSuccess(res, { message: "Invoice deleted" });
});

export const cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === InvoiceStatus.PAID) {
    throw ApiError.badRequest("Paid invoices cannot be cancelled");
  }
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw ApiError.badRequest("Invoice is already cancelled");
  }

  invoice.status = InvoiceStatus.CANCELLED;
  invoice.lastUpdatedBy = req.user?.sub as never;
  await invoice.save();
  await syncClientTotals(invoice.companyId, invoice.clientId);

  return sendSuccess(res, { message: "Invoice cancelled", data: invoice });
});

export const sendInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw ApiError.badRequest("Cannot send a cancelled invoice");
  }

  if (!invoice.shareToken) invoice.shareToken = generateToken(20);
  if (invoice.status === InvoiceStatus.DRAFT) invoice.status = InvoiceStatus.SENT;
  invoice.sentAt = new Date();
  await invoice.save();

  const [company, client] = await Promise.all([
    CompanyModel.findById(req.companyId).select("companyName"),
    ClientModel.findById(invoice.clientId).select("name email"),
  ]);

  if (client?.email) {
    await enqueueEmail({
      job: EMAIL_JOBS.INVOICE_TO_CLIENT,
      to: client.email,
      clientName: client.name,
      companyName: company?.companyName ?? "",
      invoiceNumber: invoice.invoiceNumber,
      amount: formatCurrency(invoice.grandTotal, invoice.currency),
      dueDate: invoice.dueDate.toLocaleDateString(),
      shareUrl: `${env.CLIENT_BASE_URL}/invoices/public/${invoice.shareToken}`,
    });
  }

  await enqueuePdf({ job: PDF_JOBS.INVOICE, invoiceId: invoice._id.toString() });

  await recordAudit({
    companyId: req.companyId,
    actorId: req.user!.sub,
    actorType: UserType.USER,
    action: "invoice.sent",
    targetType: "Invoice",
    targetId: invoice._id,
    ipAddress: req.ip,
  });

  return sendSuccess(res, {
    message: client?.email ? "Invoice sent to client" : "Invoice marked as sent (client has no email)",
    data: invoice,
  });
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.DRAFT) {
    throw ApiError.badRequest("Payments can only be recorded against sent invoices");
  }

  const { amount, paidOn, method, reference } = req.body;
  if (amount > invoice.amountDue + 0.001) {
    throw ApiError.badRequest("Payment exceeds the amount due");
  }

  invoice.paymentHistory.push({
    amount,
    paidOn: paidOn ?? new Date(),
    method,
    reference,
    recordedBy: req.user?.sub as never,
  });
  invoice.amountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100;
  applyPaymentStatus(invoice);
  await invoice.save();
  await syncClientTotals(invoice.companyId, invoice.clientId);

  return sendSuccess(res, { message: "Payment recorded", data: invoice });
});

export const getInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const data = await buildInvoiceRenderData(invoice);
  const buffer = await generateInvoicePdf(data);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(buffer);
});

/* ---- Public (no auth) share-link endpoints ---- */

export const getPublicInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ shareToken: req.params.shareToken })
    .populate("clientId", "name email")
    .lean();
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const company = await CompanyModel.findById(invoice.companyId).select(
    "companyName legalName logoUrl currency address phone website",
  );

  return sendSuccess(res, { data: { invoice, company } });
});

export const getPublicInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await InvoiceModel.findOne({ shareToken: req.params.shareToken });
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const data = await buildInvoiceRenderData(invoice);
  const buffer = await generateInvoicePdf(data);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(buffer);
});
