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

// ── Invoice Template Design System ──────────────────────────────────────────

export type InvoiceLayout = 'classic' | 'modern' | 'minimal' | 'bold' | 'custom';
export type PageSize = 'A4' | 'Letter';
export type HeaderStyle = 'logo-left' | 'logo-right' | 'logo-center' | 'logo-top-banner';
export type FontFamily = 'Inter' | 'Roboto' | 'Lato' | 'Merriweather' | 'Poppins' | 'Custom';
export type ItemColumnKey = 'description' | 'quantity' | 'unitPrice' | 'taxRate' | 'discount' | 'amount';

export interface ItemColumn {
  key: ItemColumnKey;
  label: string;
  visible: boolean;
  width: string;
}

export interface InvoiceDesignLayout {
  pageSize: PageSize;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  headerStyle: HeaderStyle;
}

export interface InvoiceDesignBranding {
  logoUrl?: string;
  showLogo: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface InvoiceDesignTypography {
  fontFamily: FontFamily;
  customFontUrl?: string;
  baseFontSize: number;
  headingFontSize: number;
}

export interface InvoiceDesignSections {
  companyInfo: { visible: boolean; order: number; fields: string[] };
  clientInfo: { visible: boolean; order: number; label: string };
  invoiceMeta: { visible: boolean; order: number; fields: string[] };
  itemsTable: {
    visible: boolean;
    order: number;
    columns: ItemColumn[];
    zebraStripes: boolean;
    headerBackgroundColor: string;
  };
  summary: { visible: boolean; order: number; fields: string[] };
  notes: { visible: boolean; order: number; label: string };
  terms: { visible: boolean; order: number; label: string };
  paymentInstructions: { visible: boolean; order: number; content: string };
  signature: {
    visible: boolean;
    order: number;
    signatureImageUrl?: string;
    signatoryName?: string;
    signatoryTitle?: string;
  };
  footer: { visible: boolean; order: number; content: string };
}

export interface InvoiceDesign {
  layout: InvoiceDesignLayout;
  branding: InvoiceDesignBranding;
  typography: InvoiceDesignTypography;
  sections: InvoiceDesignSections;
  watermark: { enabled: boolean; text: string; opacity: number; fontSize: number };
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  baseTheme: InvoiceLayout;
  isDefault: boolean;
  design: InvoiceDesign;
}
