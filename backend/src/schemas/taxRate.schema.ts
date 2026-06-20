import { z } from "zod";
import { paginationQuery } from "./common.schema";

export const listTaxRatesQuery = paginationQuery.extend({
  includeArchived: z.coerce.boolean().optional(),
});

export const createTaxRateSchema = z.object({
  name: z.string().trim().min(1, "Tax name is required"),
  rate: z.coerce.number().min(0, "Rate must be >= 0").max(100, "Rate must be <= 100"),
  description: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

export const updateTaxRateSchema = createTaxRateSchema.partial().extend({
  isArchived: z.boolean().optional(),
});
