import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { addressSchema, type IAddress } from "./shared";

export interface IClient extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  companyNameOfClient?: string;
  billingAddress?: IAddress;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  totalInvoiced: number;
  totalOutstanding: number;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    companyNameOfClient: { type: String, trim: true },
    billingAddress: { type: addressSchema },
    taxId: { type: String, trim: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    totalInvoiced: { type: Number, default: 0 },
    totalOutstanding: { type: Number, default: 0 },
  },
  { timestamps: true },
);

clientSchema.index({ companyId: 1, name: 1 });

export const ClientModel = mongoose.model<IClient>("Client", clientSchema);
