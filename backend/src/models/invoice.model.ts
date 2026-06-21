import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { InvoiceStatus, PaymentMethod } from "../config/constants";

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  discountType: "percentage" | "flat";
  amount: number;
}

export interface IPaymentEntry {
  amount: number;
  paidOn: Date;
  method: PaymentMethod;
  reference?: string;
  recordedBy?: Types.ObjectId;
  // Set for payments made through Stripe; used to dedupe webhook retries.
  stripePaymentIntentId?: string;
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  invoiceNumber: string;
  clientId: Types.ObjectId;
  templateId: Types.ObjectId;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  shippingFee: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes?: string;
  termsAndConditions?: string;
  poNumber?: string;
  paymentHistory: IPaymentEntry[];
  shareToken?: string;
  pdfUrl?: string;
  sentAt?: Date;
  paidOn?: Date;
  lastReminderAt?: Date;
  reminderCount: number;
  createdBy: Types.ObjectId;
  lastUpdatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountType: { type: String, enum: ["percentage", "flat"], default: "percentage" },
    amount: { type: Number, required: true },
  },
  { _id: false },
);

const paymentEntrySchema = new Schema<IPaymentEntry>(
  {
    amount: { type: Number, required: true, min: 0 },
    paidOn: { type: Date, required: true, default: Date.now },
    method: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.BANK_TRANSFER },
    reference: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
    stripePaymentIntentId: { type: String, trim: true },
  },
  { _id: false },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    invoiceNumber: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: "InvoiceTemplate", required: true },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
      index: true,
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    items: { type: [invoiceItemSchema], default: [] },
    subTotal: { type: Number, required: true, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "USD", uppercase: true },
    notes: { type: String },
    termsAndConditions: { type: String },
    poNumber: { type: String, trim: true },
    paymentHistory: { type: [paymentEntrySchema], default: [] },
    shareToken: { type: String, index: true, sparse: true, unique: true },
    pdfUrl: { type: String },
    sentAt: { type: Date },
    paidOn: { type: Date },
    lastReminderAt: { type: Date },
    reminderCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

invoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, status: 1 });
invoiceSchema.index({ companyId: 1, clientId: 1 });

export const InvoiceModel = mongoose.model<IInvoice>("Invoice", invoiceSchema);
