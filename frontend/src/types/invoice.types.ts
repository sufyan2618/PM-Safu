import type { Client } from './client.types';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paidOn: string;
  method: PaymentMethod;
  reference?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  templateId: string;
  notes?: string;
  terms?: string;
  shareToken?: string;
  paymentHistory: InvoicePayment[];
  sentAt?: string;
  createdAt: string;
}

export type InvoiceLayout = 'classic' | 'modern' | 'minimal';

export interface InvoiceTemplate {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  layout: InvoiceLayout;
  isDefault: boolean;
}
