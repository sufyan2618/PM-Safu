import type { IInvoiceItem } from "../models/invoice.model";

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  discountType?: "percentage" | "flat";
}

export interface TaxBreakdownEntry {
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface InvoiceTotals {
  items: IInvoiceItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdownEntry[];
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Groups line items by tax rate and returns the taxable base + tax amount per
 * distinct rate (rates of 0 are ignored). Used for tax summaries on invoices.
 */
export function computeTaxBreakdown(
  items: Pick<IInvoiceItem, "quantity" | "unitPrice" | "taxRate" | "discount" | "discountType">[],
): TaxBreakdownEntry[] {
  const byRate = new Map<number, { taxableAmount: number; taxAmount: number }>();

  for (const item of items) {
    const taxRate = item.taxRate ?? 0;
    if (taxRate <= 0) continue;

    const lineBase = round2((item.quantity ?? 1) * (item.unitPrice ?? 0));
    const discount = item.discount ?? 0;
    const discountAmount =
      (item.discountType ?? "percentage") === "percentage"
        ? round2((lineBase * discount) / 100)
        : round2(discount);
    const taxableBase = Math.max(lineBase - discountAmount, 0);
    const taxAmount = round2((taxableBase * taxRate) / 100);

    const entry = byRate.get(taxRate) ?? { taxableAmount: 0, taxAmount: 0 };
    entry.taxableAmount = round2(entry.taxableAmount + taxableBase);
    entry.taxAmount = round2(entry.taxAmount + taxAmount);
    byRate.set(taxRate, entry);
  }

  return [...byRate.entries()]
    .map(([rate, v]) => ({ rate, taxableAmount: v.taxableAmount, taxAmount: v.taxAmount }))
    .sort((a, b) => a.rate - b.rate);
}

/**
 * Recomputes per-line and invoice-level totals from raw item inputs.
 * `amount` for each line = (qty * unitPrice) - discount + tax.
 */
export function computeInvoiceTotals(
  rawItems: InvoiceItemInput[],
  shippingFee = 0,
): InvoiceTotals {
  let subTotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  const items: IInvoiceItem[] = rawItems.map((item) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.unitPrice ?? 0;
    const taxRate = item.taxRate ?? 0;
    const discount = item.discount ?? 0;
    const discountType = item.discountType ?? "percentage";

    const lineBase = round2(quantity * unitPrice);
    const discountAmount =
      discountType === "percentage" ? round2((lineBase * discount) / 100) : round2(discount);
    const taxableBase = Math.max(lineBase - discountAmount, 0);
    const taxAmount = round2((taxableBase * taxRate) / 100);
    const amount = round2(taxableBase + taxAmount);

    subTotal += lineBase;
    totalDiscount += discountAmount;
    totalTax += taxAmount;

    return {
      description: item.description,
      quantity,
      unitPrice,
      taxRate,
      discount,
      discountType,
      amount,
    };
  });

  subTotal = round2(subTotal);
  totalDiscount = round2(totalDiscount);
  totalTax = round2(totalTax);
  const grandTotal = round2(subTotal - totalDiscount + totalTax + (shippingFee || 0));

  return { items, subTotal, totalTax, totalDiscount, grandTotal, taxBreakdown: computeTaxBreakdown(items) };
}
