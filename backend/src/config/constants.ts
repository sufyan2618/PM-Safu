export enum CompanyRole {
  COMPANY_ADMIN = "company_admin",
  HR_MANAGER = "hr_manager",
  ACCOUNTANT = "accountant",
  STAFF = "staff",
}

export const COMPANY_ROLES = Object.values(CompanyRole);

export enum PlatformScope {
  SUPER_ADMIN = "super_admin",
}

export enum CompanyStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  CARD = "card",
  CHEQUE = "cheque",
  OTHER = "other",
}

export enum PayrollStatus {
  DRAFT = "draft",
  PROCESSING = "processing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
}

export enum EmployeeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  TERMINATED = "terminated",
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
}

export enum UserType {
  USER = "user",
  SUPER_ADMIN = "super_admin",
}

export enum CounterType {
  INVOICE = "invoice",
  PAYROLL = "payroll",
}

export enum BaseTheme {
  CLASSIC = "classic",
  MODERN = "modern",
  MINIMAL = "minimal",
  BOLD = "bold",
  CUSTOM = "custom",
}

export const QUEUE_NAMES = {
  EMAIL: "email",
  PDF: "pdf",
  PAYROLL: "payroll",
  REMINDER: "reminder",
} as const;

export const EMAIL_JOBS = {
  COMPANY_RECEIVED: "sendCompanyReceivedEmail",
  COMPANY_APPROVED: "sendCompanyApprovedEmail",
  COMPANY_REJECTED: "sendCompanyRejectedEmail",
  INVOICE_TO_CLIENT: "sendInvoiceToClient",
  PAYMENT_REMINDER: "sendPaymentReminder",
  USER_INVITE: "sendUserInvite",
  PASSWORD_RESET: "sendPasswordReset",
  EMAIL_VERIFICATION: "sendEmailVerification",
  SALARY_SLIP_SENT: "sendSalarySlipEmail",
} as const;

export const PDF_JOBS = {
  INVOICE: "generateInvoicePdf",
  SALARY_SLIP: "generateSalarySlipPdf",
} as const;

export const PAYROLL_JOBS = {
  PROCESS_RUN: "processPayrollRun",
} as const;

export const REMINDER_JOBS = {
  CHECK_OVERDUE: "checkOverdueInvoices",
  DUE_SOON: "sendDueSoonReminders",
} as const;

export const DEFAULT_QUEUE_JOB_OPTIONS = {
  removeOnComplete: 200,
  removeOnFail: 1000,
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000,
  },
};

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};
