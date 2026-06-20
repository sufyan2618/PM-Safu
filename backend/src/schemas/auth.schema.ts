import { z } from "zod";

const password = z.string().min(8, "Password must be at least 8 characters");

export const registerCompanySchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  registrationEmail: z.string().trim().toLowerCase().email("Valid email is required"),
  password,
  adminName: z.string().trim().min(2, "Admin name is required"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Reset token is required"),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  newPassword: password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
