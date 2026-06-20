import { z } from "zod";
import { objectId, paginationQuery } from "./common.schema";

export const listDepartmentsQuery = paginationQuery;

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, "Department name is required"),
  description: z.string().trim().optional(),
  headOfDepartment: objectId.optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});
