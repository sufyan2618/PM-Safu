import { z } from "zod";
import { addressSchema, hexColor, objectId } from "./common.schema";

export const updateCompanySetupSchema = z.object({
  legalName: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  brandColor: hexColor.optional(),
  address: addressSchema,
  phone: z.string().trim().optional(),
  website: z.string().trim().url("Website must be a valid URL").optional().or(z.literal("")),
  taxId: z.string().trim().optional(),
  currency: z.string().trim().length(3, "Currency must be a 3-letter code").optional(),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12).optional(),
  completeOnboarding: z.boolean().optional(),
});

export const invoiceSettingsSchema = z.object({
  prefix: z.string().trim().min(1).max(10).optional(),
  nextNumber: z.coerce.number().int().min(1).optional(),
  numberPadding: z.coerce.number().int().min(1).max(10).optional(),
  defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
  defaultTemplateId: objectId.optional(),
});

export const payrollSettingsSchema = z.object({
  payDay: z.coerce.number().int().min(1).max(31).optional(),
  defaultWorkingDaysPerMonth: z.coerce.number().int().min(1).max(31).optional(),
});
