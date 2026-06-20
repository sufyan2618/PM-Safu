/**
 * Raw response shapes returned by the backend API. These mirror the documented
 * server payloads (Mongo `_id`, snake-ish field names, populated references) and
 * are translated into the app's UI types by the mappers in `mappers.ts`.
 */
import type { Address, CompanyStatus } from '@/types/company.types';
import type { Role } from '@/types/user.types';
import type { InvoiceStatus, PaymentMethod } from '@/types/invoice.types';
import type { EmployeeStatus, EmploymentType } from '@/types/employee.types';
import type { PayrollStatus } from '@/types/payroll.types';
import type { SalarySlipPaymentStatus } from '@/types/salarySlip.types';

export interface ApiUser {
  _id?: string;
  id?: string;
  companyId: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface ApiCompany {
  _id: string;
  companyName: string;
  registrationEmail: string;
  status: CompanyStatus;
  rejectionReason?: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  legalName?: string;
  industry?: string;
  logoUrl?: string;
  brandColor?: string;
  address?: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  currency: string;
  fiscalYearStartMonth: number;
  invoiceSettings: {
    prefix: string;
    nextNumber: number;
    numberPadding: number;
    defaultPaymentTermsDays: number;
    defaultTemplateId?: string;
  };
  payrollSettings: { payDay: number; defaultWorkingDaysPerMonth: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiClient {
  _id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  companyNameOfClient?: string;
  billingAddress?: Address;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  totalInvoiced: number;
  totalOutstanding: number;
  createdAt?: string;
}

export interface ApiInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'flat';
  amount: number;
}

export interface ApiPaymentEntry {
  amount: number;
  paidOn: string;
  method: PaymentMethod;
  reference?: string;
}

export interface ApiInvoice {
  _id: string;
  companyId: string;
  invoiceNumber: string;
  clientId: string | ApiClient;
  templateId: string | { _id: string; name?: string; baseTheme?: string };
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: ApiInvoiceItem[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  shippingFee: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes?: string;
  termsAndConditions?: string;
  poNumber?: string;
  paymentHistory: ApiPaymentEntry[];
  shareToken?: string;
  pdfUrl?: string;
  sentAt?: string;
  createdAt?: string;
}

export interface ApiInvoiceTemplate {
  _id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  baseTheme: 'classic' | 'modern' | 'minimal' | 'bold' | 'custom';
  design: {
    layout?: {
      pageSize?: string;
      orientation?: string;
      margins?: { top: number; right: number; bottom: number; left: number };
      headerStyle?: string;
    };
    branding?: {
      logoUrl?: string;
      showLogo?: boolean;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    typography?: {
      fontFamily?: string;
      customFontUrl?: string;
      baseFontSize?: number;
      headingFontSize?: number;
    };
    sections?: {
      companyInfo?: { visible?: boolean; order?: number; fields?: string[] };
      clientInfo?: { visible?: boolean; order?: number; label?: string };
      invoiceMeta?: { visible?: boolean; order?: number; fields?: string[] };
      itemsTable?: {
        visible?: boolean;
        order?: number;
        columns?: { key: string; label: string; visible: boolean; width: string }[];
        zebraStripes?: boolean;
        headerBackgroundColor?: string;
      };
      summary?: { visible?: boolean; order?: number; fields?: string[] };
      notes?: { visible?: boolean; order?: number; label?: string };
      terms?: { visible?: boolean; order?: number; label?: string };
      paymentInstructions?: { visible?: boolean; order?: number; content?: string };
      signature?: { visible?: boolean; order?: number; signatureImageUrl?: string; signatoryName?: string; signatoryTitle?: string };
      footer?: { visible?: boolean; order?: number; content?: string };
    };
    watermark?: { enabled?: boolean; text?: string; opacity?: number; fontSize?: number };
  };
  thumbnailUrl?: string;
  isArchived: boolean;
}

export interface ApiDepartment {
  _id: string;
  companyId: string;
  name: string;
  description?: string;
  headOfDepartment?: string | { _id: string; firstName: string; lastName: string };
  isActive: boolean;
  employeeCount?: number;
}

export interface ApiSalaryComponent {
  name: string;
  type?: 'fixed' | 'percentage_of_base';
  value?: number;
  amount?: number;
  taxable?: boolean;
}

export interface ApiSalaryStructure {
  _id: string;
  companyId: string;
  name: string;
  isTemplate: boolean;
  baseSalary: number;
  allowances: ApiSalaryComponent[];
  deductions: ApiSalaryComponent[];
  effectiveFrom: string;
}

export interface ApiEmployee {
  _id: string;
  companyId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  departmentId: string | { _id: string; name: string };
  designation: string;
  employmentType: EmploymentType;
  dateOfJoining: string;
  dateOfLeaving?: string;
  status: EmployeeStatus;
  bankDetails?: { accountTitle?: string; accountNumber?: string; bankName?: string; branchCode?: string };
  address?: Address;
  salaryStructureId: string | ApiSalaryStructure;
}

export interface ApiPayroll {
  _id: string;
  companyId: string;
  period: { month: number; year: number };
  status: PayrollStatus;
  processedAt?: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  notes?: string;
  createdAt?: string;
}

export interface ApiSalarySlipEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
  email?: string;
  phone?: string;
  dateOfJoining?: string;
  employmentType?: string;
  departmentId?: string | { _id: string; name: string };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
    branchCode?: string;
  };
}

export interface ApiSalarySlip {
  _id: string;
  companyId: string;
  payrollId: string;
  employeeId: string | ApiSalarySlipEmployee;
  period: { month: number; year: number };
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  paymentStatus: SalarySlipPaymentStatus;
  paidOn?: string;
  pdfUrl?: string;
}

export interface ApiDashboardOverview {
  totalRevenue: number;
  totalOutstanding: number;
  totalInvoices: number;
  invoiceStatusCounts: { _id: InvoiceStatus; count: number; amount: number }[];
  activeEmployees: number;
  payrollExpenseThisMonth: number;
  monthStart: string;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueDelta: number;
  payrollExpenseLastMonth: number;
  payrollDelta: number;
  overdueCount: number;
  departmentCount: number;
  newHiresThisMonth: number;
}

export interface ApiInvoiceStatusBreakdown {
  _id: InvoiceStatus;
  count: number;
  totalAmount: number;
  amountDue: number;
}

export interface ApiFinancialSummary {
  from: string;
  to: string;
  revenue: number;
  payrollExpense: number;
  net: number;
  outstanding: number;
  invoiceStatusBreakdown: ApiInvoiceStatusBreakdown[];
  revenueSeries: ApiTrendPoint[];
  payroll: { net: number; gross: number; deductions: number };
}

export interface ApiTrendPoint {
  _id: { year: number; month: number };
  revenue?: number;
  count?: number;
  totalNet?: number;
  totalGross?: number;
  employeeCount?: number;
}

export interface ApiOutstandingClient {
  _id: string;
  name: string;
  companyNameOfClient?: string;
  totalOutstanding: number;
  totalInvoiced: number;
}

export interface ApiTaxRate {
  _id: string;
  companyId: string;
  name: string;
  rate: number;
  description?: string;
  isDefault: boolean;
  isArchived: boolean;
}

export interface ApiAuditLog {
  _id: string;
  actorId?: string;
  actorName?: string | null;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  status: 'success' | 'failed';
  statusCode?: number;
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
