import type { Request, Response } from "express";
import { AuditLogModel } from "../models/auditLog.model";
import { UserModel } from "../models/user.model";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { action, status, actorId, targetType, dateFrom, dateTo, search } = req.query as {
    action?: string;
    status?: string;
    actorId?: string;
    targetType?: string;
    dateFrom?: string | Date;
    dateTo?: string | Date;
    search?: string;
  };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (action) filter.action = action;
  if (status) filter.status = status;
  if (actorId) filter.actorId = actorId;
  if (targetType) filter.targetType = targetType;

  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom) range.$gte = new Date(dateFrom);
    if (dateTo) range.$lte = new Date(dateTo);
    filter.createdAt = range;
  }

  if (search) {
    const rx = new RegExp(escapeRegExp(search), "i");
    filter.$or = [
      { action: rx },
      { actorEmail: rx },
      { actorName: rx },
      { ipAddress: rx },
      { path: rx },
      { targetType: rx },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLogModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    AuditLogModel.countDocuments(filter),
  ]);

  // Resolve current actor names for entries that did not capture one at write time.
  const missingNameIds = [
    ...new Set(
      logs.filter((log) => !log.actorName && log.actorId).map((log) => log.actorId.toString()),
    ),
  ];
  const nameById = new Map<string, string>();
  if (missingNameIds.length > 0) {
    const actors = await UserModel.find({ _id: { $in: missingNameIds } })
      .select("name")
      .lean();
    for (const actor of actors) nameById.set(actor._id.toString(), actor.name);
  }

  const data = logs.map((log) => ({
    ...log,
    actorName: log.actorName ?? nameById.get(log.actorId?.toString() ?? "") ?? null,
  }));

  return sendSuccess(res, { data, meta: buildMeta(total, page, limit) });
});

/** Distinct action keys for the company — powers the filter dropdown in the UI. */
export const listAuditActions = asyncHandler(async (req: Request, res: Response) => {
  const actions = await AuditLogModel.distinct("action", { companyId: req.companyId });
  return sendSuccess(res, { data: actions.sort() });
});
