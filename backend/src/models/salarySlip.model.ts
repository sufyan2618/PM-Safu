import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { PaymentStatus } from "../config/constants";

export interface ISlipLine {
  name: string;
  amount: number;
}

export interface ISalarySlip extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  payrollId: Types.ObjectId;
  employeeId: Types.ObjectId;
  period: { month: number; year: number };
  baseSalary: number;
  allowances: ISlipLine[];
  deductions: ISlipLine[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  paymentStatus: PaymentStatus;
  paidOn?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const slipLineSchema = new Schema<ISlipLine>(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false },
);

const salarySlipSchema = new Schema<ISalarySlip>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    payrollId: { type: Schema.Types.ObjectId, ref: "Payroll", required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    period: {
      month: { type: Number, required: true },
      year: { type: Number, required: true },
    },
    baseSalary: { type: Number, required: true },
    allowances: { type: [slipLineSchema], default: [] },
    deductions: { type: [slipLineSchema], default: [] },
    grossSalary: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    workingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paidOn: { type: Date },
    pdfUrl: { type: String },
  },
  { timestamps: true },
);

salarySlipSchema.index({ companyId: 1, payrollId: 1, employeeId: 1 }, { unique: true });

export const SalarySlipModel = mongoose.model<ISalarySlip>("SalarySlip", salarySlipSchema);
