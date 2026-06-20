import { z } from "zod";
import { CompanyRole } from "../config/constants";
import { paginationQuery } from "./common.schema";

export const listUsersQuery = paginationQuery.extend({
  role: z.nativeEnum(CompanyRole).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  role: z.nativeEnum(CompanyRole),
  password: z.string().min(8).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    role: z.nativeEnum(CompanyRole).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });
