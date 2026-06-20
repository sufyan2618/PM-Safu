import { z } from "zod";
import { PayrollStatus } from "../config/constants";
import { objectId, paginationQuery } from "./common.schema";

export const listPayrollQuery = paginationQuery.extend({
  year: z.coerce.number().int().optional(),
  status: z.nativeEnum(PayrollStatus).optional(),
});

export const processPayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  employeeIds: z.array(objectId).optional(),
  notes: z.string().trim().optional(),
});

export const payrollReportQuery = z.object({
  months: z.coerce.number().int().min(1).max(36).optional(),
});
