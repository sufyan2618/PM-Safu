import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { CompanyStatus } from "../config/constants";
import { addressSchema, type IAddress } from "./shared";

export interface IInvoiceSettings {
  prefix: string;
  nextNumber: number;
  numberPadding: number;
  defaultPaymentTermsDays: number;
  defaultTemplateId?: Types.ObjectId;
}

export interface IPayrollSettings {
  payDay: number;
  defaultWorkingDaysPerMonth: number;
}

export interface ICompany extends Document {
  _id: Types.ObjectId;
  companyName: string;
  registrationEmail: string;
  status: CompanyStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  isActive: boolean;
  onboardingCompleted: boolean;

  legalName?: string;
  industry?: string;
  logoUrl?: string;
  brandColor?: string;
  address?: IAddress;
  phone?: string;
  website?: string;
  taxId?: string;
  currency: string;
  fiscalYearStartMonth: number;
  invoiceSettings: IInvoiceSettings;
  payrollSettings: IPayrollSettings;

  createdAt: Date;
  updatedAt: Date;
}

const invoiceSettingsSchema = new Schema<IInvoiceSettings>(
  {
    prefix: { type: String, default: "INV", trim: true },
    nextNumber: { type: Number, default: 1 },
    numberPadding: { type: Number, default: 4 },
    defaultPaymentTermsDays: { type: Number, default: 14 },
    defaultTemplateId: { type: Schema.Types.ObjectId, ref: "InvoiceTemplate" },
  },
  { _id: false },
);

const payrollSettingsSchema = new Schema<IPayrollSettings>(
  {
    payDay: { type: Number, default: 1, min: 1, max: 31 },
    defaultWorkingDaysPerMonth: { type: Number, default: 26 },
  },
  { _id: false },
);

const companySchema = new Schema<ICompany>(
  {
    companyName: { type: String, required: true, trim: true },
    registrationEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: Object.values(CompanyStatus),
      default: CompanyStatus.PENDING,
      index: true,
    },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "SuperAdmin" },
    reviewedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    onboardingCompleted: { type: Boolean, default: false },

    legalName: { type: String, trim: true },
    industry: { type: String, trim: true },
    logoUrl: { type: String },
    brandColor: { type: String },
    address: { type: addressSchema },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    taxId: { type: String, trim: true },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    fiscalYearStartMonth: { type: Number, default: 1, min: 1, max: 12 },
    invoiceSettings: { type: invoiceSettingsSchema, default: () => ({}) },
    payrollSettings: { type: payrollSettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const CompanyModel = mongoose.model<ICompany>("Company", companySchema);
