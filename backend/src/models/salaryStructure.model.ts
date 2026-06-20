import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";

export interface ISalaryComponent {
  name: string;
  type: "fixed" | "percentage_of_base";
  value: number;
  taxable?: boolean;
}

export interface ISalaryStructure extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  isTemplate: boolean;
  baseSalary: number;
  allowances: ISalaryComponent[];
  deductions: ISalaryComponent[];
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const allowanceSchema = new Schema<ISalaryComponent>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["fixed", "percentage_of_base"], default: "fixed" },
    value: { type: Number, required: true, min: 0 },
    taxable: { type: Boolean, default: true },
  },
  { _id: false },
);

const deductionSchema = new Schema<ISalaryComponent>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["fixed", "percentage_of_base"], default: "fixed" },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const salaryStructureSchema = new Schema<ISalaryStructure>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    isTemplate: { type: Boolean, default: false },
    baseSalary: { type: Number, required: true, min: 0 },
    allowances: { type: [allowanceSchema], default: [] },
    deductions: { type: [deductionSchema], default: [] },
    effectiveFrom: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const SalaryStructureModel = mongoose.model<ISalaryStructure>(
  "SalaryStructure",
  salaryStructureSchema,
);
