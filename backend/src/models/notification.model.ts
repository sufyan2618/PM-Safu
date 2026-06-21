import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";

export type NotificationType =
  | "invoice_paid"
  | "invoice_overdue"
  | "payroll_finalized"
  | "salary_slip_sent";

export interface INotification extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    type: {
      type: String,
      enum: ["invoice_paid", "invoice_overdue", "payroll_finalized", "salary_slip_sent"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Primary access pattern: most-recent-first within a company.
notificationSchema.index({ companyId: 1, createdAt: -1 });

// Auto-expire notifications after 30 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const NotificationModel = mongoose.model<INotification>("Notification", notificationSchema);
