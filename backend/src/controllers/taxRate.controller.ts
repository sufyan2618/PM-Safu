import type { Request, Response } from "express";
import { TaxRateModel } from "../models/taxRate.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";

/** Ensures only one default tax rate per company. */
async function clearOtherDefaults(companyId: unknown, exceptId?: unknown) {
  await TaxRateModel.updateMany(
    { companyId, isDefault: true, ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
    { $set: { isDefault: false } },
  );
}

export const listTaxRates = asyncHandler(async (req: Request, res: Response) => {
  const { includeArchived } = req.query as { includeArchived?: boolean };
  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (!includeArchived) filter.isArchived = false;

  const taxRates = await TaxRateModel.find(filter).sort({ isDefault: -1, name: 1 });
  return sendSuccess(res, { data: taxRates });
});

export const createTaxRate = asyncHandler(async (req: Request, res: Response) => {
  const taxRate = await TaxRateModel.create({ ...req.body, companyId: req.companyId });
  if (taxRate.isDefault) await clearOtherDefaults(req.companyId, taxRate._id);
  return sendCreated(res, { message: "Tax rate created", data: taxRate });
});

export const updateTaxRate = asyncHandler(async (req: Request, res: Response) => {
  const taxRate = await TaxRateModel.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!taxRate) throw ApiError.notFound("Tax rate not found");
  if (taxRate.isDefault) await clearOtherDefaults(req.companyId, taxRate._id);
  return sendSuccess(res, { message: "Tax rate updated", data: taxRate });
});

export const deleteTaxRate = asyncHandler(async (req: Request, res: Response) => {
  const taxRate = await TaxRateModel.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
  if (!taxRate) throw ApiError.notFound("Tax rate not found");
  return sendSuccess(res, { message: "Tax rate deleted" });
});
