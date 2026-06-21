import type { Types } from "mongoose";
import { InvoiceStatus } from "../config/constants";
import { ClientModel } from "../models/client.model";
import { InvoiceModel, type IInvoice } from "../models/invoice.model";

/**
 * Recomputes amountDue and derives the invoice status from how much has been paid.
 * Shared by manual payment recording and the Stripe webhook so both stay consistent.
 */
export function applyPaymentStatus(invoice: IInvoice) {
  invoice.amountDue = Math.max(invoice.grandTotal - invoice.amountPaid, 0);
  if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.DRAFT) return;
  if (invoice.amountDue <= 0) {
    invoice.status = InvoiceStatus.PAID;
    // Record when the invoice was fully settled (used by revenue analytics).
    if (!invoice.paidOn) {
      const lastPayment = invoice.paymentHistory.at(-1);
      invoice.paidOn = lastPayment?.paidOn ?? new Date();
    }
  } else if (invoice.amountPaid > 0) {
    invoice.status = InvoiceStatus.PARTIALLY_PAID;
  }
}

/** Re-aggregates a client's invoiced/outstanding totals across all non-cancelled invoices. */
export async function syncClientTotals(companyId: Types.ObjectId, clientId: Types.ObjectId) {
  const agg = await InvoiceModel.aggregate<{ _id: null; invoiced: number; outstanding: number }>([
    {
      $match: {
        companyId,
        clientId,
        status: { $ne: InvoiceStatus.CANCELLED },
      },
    },
    {
      $group: {
        _id: null,
        invoiced: { $sum: "$grandTotal" },
        outstanding: { $sum: "$amountDue" },
      },
    },
  ]);
  const totals = agg[0];
  await ClientModel.updateOne(
    { _id: clientId },
    { $set: { totalInvoiced: totals?.invoiced ?? 0, totalOutstanding: totals?.outstanding ?? 0 } },
  );
}
