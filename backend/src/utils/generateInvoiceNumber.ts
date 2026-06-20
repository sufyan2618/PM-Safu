import type { Types } from "mongoose";
import { CounterType } from "../config/constants";
import { CounterModel } from "../models/counter.model";
import type { IInvoiceSettings } from "../models/company.model";

/**
 * Atomically increments the per-company invoice counter and formats the number
 * using the company's invoice settings (e.g. INV-0001). Safe under concurrency.
 */
export async function generateInvoiceNumber(
  companyId: Types.ObjectId,
  settings: IInvoiceSettings,
): Promise<{ invoiceNumber: string; seq: number }> {
  const counter = await CounterModel.findOneAndUpdate(
    { companyId, type: CounterType.INVOICE },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Keep the counter at least at the configured starting number.
  let seq = counter.seq;
  const startAt = settings.nextNumber ?? 1;
  if (seq < startAt) {
    const synced = await CounterModel.findOneAndUpdate(
      { companyId, type: CounterType.INVOICE },
      { $set: { seq: startAt } },
      { new: true },
    );
    seq = synced?.seq ?? startAt;
  }

  const prefix = settings.prefix || "INV";
  const padding = settings.numberPadding ?? 4;
  const invoiceNumber = `${prefix}-${String(seq).padStart(padding, "0")}`;
  return { invoiceNumber, seq };
}
