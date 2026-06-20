import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    companyName: z.string().min(2, 'Company name is required'),
    adminName: z.string().min(2, 'Your name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const clientSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});
export type ClientFormValues = z.infer<typeof clientSchema>;

export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Qty must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Price must be 0 or more'),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  templateId: z.string().min(1, 'Select a template'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item'),
});
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const employeeSchema = z.object({
  name: z.string().min(2, 'Employee name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  employeeCode: z.string().min(1, 'Employee code is required'),
  departmentId: z.string().min(1, 'Select a department'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: z.enum(['full_time', 'part_time', 'contract']),
  joinDate: z.string().min(1, 'Join date is required'),
});
export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  description: z.string().optional(),
});
export type DepartmentFormValues = z.infer<typeof departmentSchema>;

export const userInviteSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'manager', 'accountant', 'employee']),
});
export type UserInviteFormValues = z.infer<typeof userInviteSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const companySettingsSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  address: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().min(1, 'Select a currency'),
  invoicePrefix: z.string().optional(),
});
export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;
