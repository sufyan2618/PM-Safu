import { z } from "zod";
import { CompanyStatus } from "../config/constants";
import { paginationQuery } from "./common.schema";

export const listCompaniesQuery = paginationQuery.extend({
  status: z.nativeEnum(CompanyStatus).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const rejectCompanySchema = z.object({
  reason: z.string().trim().min(3, "A rejection reason is required"),
});
