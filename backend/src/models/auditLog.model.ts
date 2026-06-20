import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { UserType } from "../config/constants";

export type AuditStatus = "success" | "failed";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  companyId?: Types.ObjectId;
  actorId: Types.ObjectId;
  actorType: UserType;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: Types.ObjectId;
  status: AuditStatus;
  statusCode?: number;
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, sparse: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    actorType: { type: String, enum: Object.values(UserType), required: true },
    actorName: { type: String },
    actorEmail: { type: String },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: ["success", "failed"], default: "success", index: true },
    statusCode: { type: Number },
    method: { type: String },
    path: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Primary access pattern: most-recent-first within a company.
auditLogSchema.index({ companyId: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
