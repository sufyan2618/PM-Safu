import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { UserType } from "../config/constants";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  companyId?: Types.ObjectId;
  actorId: Types.ObjectId;
  actorType: UserType;
  action: string;
  targetType?: string;
  targetId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, sparse: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    actorType: { type: String, enum: Object.values(UserType), required: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true },
);

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
