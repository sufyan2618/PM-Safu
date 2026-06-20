import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";

export interface ITaxRate extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  rate: number;
  description?: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taxRateSchema = new Schema<ITaxRate>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

taxRateSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const TaxRateModel = mongoose.model<ITaxRate>("TaxRate", taxRateSchema);
