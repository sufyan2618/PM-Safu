import { z } from "zod";
import { PaymentStatus } from "../config/constants";
import { objectId, paginationQuery } from "./common.schema";

export const listSalarySlipsQuery = paginationQuery.extend({
  employeeId: objectId.optional(),
  payrollId: objectId.optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

export const markSlipPaidSchema = z.object({
  paidOn: z.coerce.date().optional(),
});
