import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { PayrollStatus } from "../config/constants";

export interface IPayrollPeriod {
  month: number;
  year: number;
}

export interface IPayroll extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  period: IPayrollPeriod;
  status: PayrollStatus;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const periodSchema = new Schema<IPayrollPeriod>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
  },
  { _id: false },
);

const payrollSchema = new Schema<IPayroll>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    period: { type: periodSchema, required: true },
    status: {
      type: String,
      enum: Object.values(PayrollStatus),
      default: PayrollStatus.DRAFT,
      index: true,
    },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    employeeCount: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

payrollSchema.index({ companyId: 1, "period.year": 1, "period.month": 1 }, { unique: true });

export const PayrollModel = mongoose.model<IPayroll>("Payroll", payrollSchema);
