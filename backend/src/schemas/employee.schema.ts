import { z } from "zod";
import { EmployeeStatus, EmploymentType } from "../config/constants";
import { addressSchema, objectId, paginationQuery } from "./common.schema";
import { createSalaryStructureSchema } from "./salaryStructure.schema";

const bankDetailsSchema = z
  .object({
    accountTitle: z.string().trim().optional(),
    accountNumber: z.string().trim().optional(),
    bankName: z.string().trim().optional(),
    branchCode: z.string().trim().optional(),
  })
  .optional();

const emergencyContactSchema = z
  .object({
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    relation: z.string().trim().optional(),
  })
  .optional();

export const listEmployeesQuery = paginationQuery.extend({
  departmentId: objectId.optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export const createEmployeeSchema = z
  .object({
    employeeCode: z.string().trim().optional(),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().toLowerCase().email("Valid email is required"),
    phone: z.string().trim().optional(),
    departmentId: objectId,
    designation: z.string().trim().min(1, "Designation is required"),
    employmentType: z.nativeEnum(EmploymentType).optional(),
    dateOfJoining: z.coerce.date(),
    bankDetails: bankDetailsSchema,
    address: addressSchema,
    emergencyContact: emergencyContactSchema,
    // Either reference an existing structure or provide a new one to create.
    salaryStructureId: objectId.optional(),
    salaryStructure: createSalaryStructureSchema.optional(),
  })
  .refine((data) => data.salaryStructureId || data.salaryStructure, {
    message: "Provide either salaryStructureId or salaryStructure",
    path: ["salaryStructureId"],
  });

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().optional(),
  departmentId: objectId.optional(),
  designation: z.string().trim().min(1).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  dateOfJoining: z.coerce.date().optional(),
  dateOfLeaving: z.coerce.date().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  bankDetails: bankDetailsSchema,
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  salaryStructureId: objectId.optional(),
});
