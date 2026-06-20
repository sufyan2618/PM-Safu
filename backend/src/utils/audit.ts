import type { Types } from "mongoose";
import type { UserType } from "../config/constants";
import { AuditLogModel } from "../models/auditLog.model";
import { logger } from "../lib/logger";

interface AuditInput {
  companyId?: Types.ObjectId | string;
  actorId: Types.ObjectId | string;
  actorType: UserType;
  action: string;
  targetType?: string;
  targetId?: Types.ObjectId | string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/** Fire-and-forget audit log. Never throws — auditing must not break a request. */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await AuditLogModel.create(input);
  } catch (error) {
    logger.warn("Failed to write audit log", {
      action: input.action,
      error: (error as Error).message,
    });
  }
}
