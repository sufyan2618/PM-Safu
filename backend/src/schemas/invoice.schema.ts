import { z } from "zod";
import { InvoiceStatus, PaymentMethod } from "../config/constants";
import { objectId, paginationQuery } from "./common.schema";

const itemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required"),
  quantity: z.coerce.number().min(0).default(1),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  discount: z.coerce.number().min(0).optional(),
  discountType: z.enum(["percentage", "flat"]).optional(),
});

export const listInvoicesQuery = paginationQuery.extend({
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientId: objectId.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const createInvoiceSchema = z.object({
  clientId: objectId,
  templateId: objectId.optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  items: z.array(itemSchema).min(1, "At least one line item is required"),
  shippingFee: z.coerce.number().min(0).optional(),
  currency: z.string().trim().length(3).optional(),
  notes: z.string().trim().optional(),
  termsAndConditions: z.string().trim().optional(),
  poNumber: z.string().trim().optional(),
});

export const updateInvoiceSchema = z.object({
  clientId: objectId.optional(),
  templateId: objectId.optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  items: z.array(itemSchema).min(1).optional(),
  shippingFee: z.coerce.number().min(0).optional(),
  currency: z.string().trim().length(3).optional(),
  notes: z.string().trim().optional(),
  termsAndConditions: z.string().trim().optional(),
  poNumber: z.string().trim().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be greater than zero"),
  paidOn: z.coerce.date().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().trim().optional(),
});

export const cancelInvoiceSchema = z.object({
  reason: z.string().trim().optional(),
});

export const shareTokenParam = z.object({
  shareToken: z.string().min(10),
});
