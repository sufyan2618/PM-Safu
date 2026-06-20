import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { BaseTheme } from "../config/constants";
import type { InvoiceDesign } from "../types/invoiceTemplate.types";

export interface IInvoiceTemplate extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  isDefault: boolean;
  baseTheme: BaseTheme;
  createdBy?: Types.ObjectId;
  design: InvoiceDesign;
  thumbnailUrl?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// The design blob is validated by Zod at the controller layer; stored as Mixed for flexibility.
const invoiceTemplateSchema = new Schema<IInvoiceTemplate>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    baseTheme: {
      type: String,
      enum: Object.values(BaseTheme),
      default: BaseTheme.CLASSIC,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    design: { type: Schema.Types.Mixed, required: true },
    thumbnailUrl: { type: String },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

invoiceTemplateSchema.index({ companyId: 1, isDefault: 1 });

export const InvoiceTemplateModel = mongoose.model<IInvoiceTemplate>(
  "InvoiceTemplate",
  invoiceTemplateSchema,
);
