import { z } from "zod";
import { addressSchema, paginationQuery } from "./common.schema";

export const listClientsQuery = paginationQuery.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const createClientSchema = z.object({
  name: z.string().trim().min(2, "Client name is required"),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  companyNameOfClient: z.string().trim().optional(),
  billingAddress: addressSchema,
  taxId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  isActive: z.boolean().optional(),
});
