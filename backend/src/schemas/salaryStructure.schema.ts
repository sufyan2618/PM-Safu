import { z } from "zod";
import { paginationQuery } from "./common.schema";

const componentSchema = z.object({
  name: z.string().trim().min(1, "Component name is required"),
  type: z.enum(["fixed", "percentage_of_base"]).optional(),
  value: z.coerce.number().min(0),
  taxable: z.boolean().optional(),
});

export const listSalaryStructuresQuery = paginationQuery.extend({
  isTemplate: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const createSalaryStructureSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  isTemplate: z.boolean().optional(),
  baseSalary: z.coerce.number().min(0),
  allowances: z.array(componentSchema).optional(),
  deductions: z.array(componentSchema).optional(),
  effectiveFrom: z.coerce.date().optional(),
});

export const updateSalaryStructureSchema = createSalaryStructureSchema.partial();
