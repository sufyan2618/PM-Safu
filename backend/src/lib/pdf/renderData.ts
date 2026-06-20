import type { InvoiceDesign } from "../../types/invoiceTemplate.types";

export interface InvoicePartyInfo {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  addressLines: string[];
}

export interface InvoiceRenderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  amount: number;
}

export interface InvoiceRenderData {
  design: InvoiceDesign;
  company: InvoicePartyInfo;
  client: InvoicePartyInfo;
  meta: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    poNumber?: string;
    status: string;
  };
  items: InvoiceRenderItem[];
  totals: {
    subTotal: number;
    totalDiscount: number;
    totalTax: number;
    shippingFee: number;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
  };
  currency: string;
  notes?: string;
  termsAndConditions?: string;
}

export interface SalarySlipRenderData {
  companyName: string;
  companyLogoUrl?: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department?: string;
  period: string;
  currency: string;
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  paymentStatus: string;
}

/** Sample invoice used by the designer live-preview endpoints. */
export function sampleInvoiceData(design: InvoiceDesign, currency = "USD"): InvoiceRenderData {
  return {
    design,
    company: {
      name: "Acme Studios Inc.",
      email: "billing@acme.example",
      phone: "+1 555 010 2030",
      website: "www.acme.example",
      taxId: "TAX-123456",
      addressLines: ["123 Market Street", "Suite 400", "San Francisco, CA 94103", "United States"],
    },
    client: {
      name: "Globex Corporation",
      email: "ap@globex.example",
      phone: "+1 555 909 1212",
      taxId: "GLX-998877",
      addressLines: ["742 Evergreen Terrace", "Springfield, IL 62704", "United States"],
    },
    meta: {
      invoiceNumber: "INV-0001",
      issueDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString(),
      poNumber: "PO-55231",
      status: "draft",
    },
    items: [
      { description: "Brand identity design", quantity: 1, unitPrice: 2500, taxRate: 8, discount: 0, amount: 2700 },
      { description: "Website development (hrs)", quantity: 40, unitPrice: 75, taxRate: 8, discount: 5, amount: 3078 },
      { description: "Monthly hosting", quantity: 3, unitPrice: 49, taxRate: 0, discount: 0, amount: 147 },
    ],
    totals: {
      subTotal: 5947,
      totalDiscount: 150,
      totalTax: 462,
      shippingFee: 0,
      grandTotal: 6259,
      amountPaid: 0,
      amountDue: 6259,
    },
    currency,
    notes: "Thank you for choosing Acme Studios. Payment is appreciated within the due date.",
    termsAndConditions: "Late payments are subject to a 1.5% monthly interest charge.",
  };
}
