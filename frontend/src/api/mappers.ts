/**
 * Anti-corruption layer: translate raw API DTOs (see `dto.ts`) into the UI
 * domain types the components consume. Keeping this isolated means the rest of
 * the app is insulated from server-side naming (`_id`, populated refs, etc.).
 */
import type {
  ApiClient,
  ApiCompany,
  ApiDashboardOverview,
  ApiDepartment,
  ApiEmployee,
  ApiInvoice,
  ApiInvoiceTemplate,
  ApiOutstandingClient,
  ApiPayroll,
  ApiSalarySlip,
  ApiSalaryStructure,
  ApiTrendPoint,
  ApiUser,
} from './dto';
import type {
  ApiEnvelope,
  ApiMeta,
  Address,
  Client,
  Company,
  CompanySummary,
  DashboardStats,
  Department,
  Employee,
  Invoice,
  InvoiceTemplate,
  OutstandingClient,
  Paginated,
  PayrollRun,
  PayrollTrendPoint,
  RevenuePoint,
  SalarySlip,
  SalaryStructure,
  User,
} from '@/types';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Build a `Paginated<T>` from a list envelope's `data` + `meta`. */
export function toPaginated<TDto, T>(
  envelope: ApiEnvelope<TDto[]>,
  map: (dto: TDto) => T,
): Paginated<T> {
  const meta: ApiMeta = envelope.meta ?? {
    page: 1,
    limit: envelope.data.length,
    total: envelope.data.length,
    totalPages: 1,
  };
  return {
    items: envelope.data.map(map),
    page: meta.page,
    pageSize: meta.limit,
    total: meta.total,
    totalPages: meta.totalPages,
  };
}

export function addressToString(address?: Address): string | undefined {
  if (!address) return undefined;
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}

/** "2026-06" from { month: 6, year: 2026 }. */
export function periodToString(period: { month: number; year: number }): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

/** { month, year } from "2026-06". */
export function periodToMonthYear(period: string): { month: number; year: number } {
  const [year, month] = period.split('-').map(Number);
  return { month, year };
}

export function mapUser(dto: ApiUser): User {
  return {
    id: (dto.id ?? dto._id) as string,
    companyId: dto.companyId,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    isActive: dto.isActive,
    avatarUrl: dto.avatarUrl,
    lastLoginAt: dto.lastLoginAt,
    createdAt: dto.createdAt,
  };
}

export function mapCompanySummary(dto: {
  id: string;
  companyName: string;
  status: CompanySummary['status'];
  isActive: boolean;
  onboardingCompleted: boolean;
  currency: string;
  logoUrl?: string;
}): CompanySummary {
  return { ...dto };
}

export function mapCompany(dto: ApiCompany): Company {
  return {
    id: dto._id,
    companyName: dto.companyName,
    registrationEmail: dto.registrationEmail,
    status: dto.status,
    rejectionReason: dto.rejectionReason,
    isActive: dto.isActive,
    onboardingCompleted: dto.onboardingCompleted,
    legalName: dto.legalName,
    industry: dto.industry,
    logoUrl: dto.logoUrl,
    brandColor: dto.brandColor,
    address: dto.address,
    phone: dto.phone,
    website: dto.website,
    taxId: dto.taxId,
    currency: dto.currency,
    fiscalYearStartMonth: dto.fiscalYearStartMonth,
    invoiceSettings: dto.invoiceSettings,
    payrollSettings: dto.payrollSettings,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapClient(dto: ApiClient): Client {
  return {
    id: dto._id,
    name: dto.name,
    email: dto.email ?? '',
    phone: dto.phone,
    companyName: dto.companyNameOfClient,
    address: addressToString(dto.billingAddress),
    taxId: dto.taxId,
    notes: dto.notes,
    totalInvoiced: dto.totalInvoiced ?? 0,
    outstandingBalance: dto.totalOutstanding ?? 0,
    isActive: dto.isActive,
    createdAt: dto.createdAt ?? '',
  };
}

export function mapInvoice(dto: ApiInvoice): Invoice {
  const client = typeof dto.clientId === 'object' ? mapClient(dto.clientId) : undefined;
  return {
    id: dto._id,
    invoiceNumber: dto.invoiceNumber,
    clientId: typeof dto.clientId === 'object' ? dto.clientId._id : dto.clientId,
    client,
    status: dto.status,
    issueDate: dto.issueDate,
    dueDate: dto.dueDate,
    lineItems: dto.items.map((item, i) => ({
      id: `li_${i}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      total: item.amount,
    })),
    subtotal: dto.subTotal,
    taxTotal: dto.totalTax,
    total: dto.grandTotal,
    amountPaid: dto.amountPaid,
    amountDue: dto.amountDue,
    currency: dto.currency,
    templateId: dto.templateId,
    notes: dto.notes,
    terms: dto.termsAndConditions,
    shareToken: dto.shareToken,
    paymentHistory: (dto.paymentHistory ?? []).map((p, i) => ({
      id: `pay_${i}`,
      amount: p.amount,
      paidOn: p.paidOn,
      method: p.method,
      reference: p.reference,
    })),
    sentAt: dto.sentAt,
    createdAt: dto.createdAt ?? '',
  };
}

const THEME_TO_LAYOUT: Record<ApiInvoiceTemplate['baseTheme'], InvoiceTemplate['layout']> = {
  classic: 'classic',
  modern: 'modern',
  minimal: 'minimal',
  bold: 'modern',
  custom: 'minimal',
};

export function mapInvoiceTemplate(dto: ApiInvoiceTemplate): InvoiceTemplate {
  const branding = dto.design?.branding ?? {};
  return {
    id: dto._id,
    name: dto.name,
    primaryColor: branding.primaryColor ?? '#0E1320',
    accentColor: branding.accentColor ?? '#0E7C5A',
    fontFamily: dto.design?.typography?.fontFamily ?? 'Inter',
    logoUrl: branding.logoUrl,
    layout: THEME_TO_LAYOUT[dto.baseTheme] ?? 'classic',
    isDefault: dto.isDefault,
  };
}

export function mapDepartment(dto: ApiDepartment): Department {
  const head = dto.headOfDepartment;
  return {
    id: dto._id,
    name: dto.name,
    description: dto.description,
    headEmployeeId: typeof head === 'object' ? head._id : head,
    headEmployeeName:
      typeof head === 'object' ? `${head.firstName} ${head.lastName}`.trim() : undefined,
    employeeCount: dto.employeeCount ?? 0,
  };
}

export function mapSalaryStructure(dto: ApiSalaryStructure): SalaryStructure {
  return {
    id: dto._id,
    employeeId: '',
    basic: dto.baseSalary,
    allowances: (dto.allowances ?? []).map((a) => ({
      label: a.name,
      amount: a.amount ?? a.value ?? 0,
    })),
    deductions: (dto.deductions ?? []).map((d) => ({
      label: d.name,
      amount: d.amount ?? d.value ?? 0,
    })),
    effectiveFrom: dto.effectiveFrom,
  };
}

export function mapEmployee(dto: ApiEmployee): Employee {
  const dept = dto.departmentId;
  const structure = dto.salaryStructureId;
  return {
    id: dto._id,
    employeeCode: dto.employeeCode,
    name: `${dto.firstName} ${dto.lastName}`.trim(),
    email: dto.email,
    phone: dto.phone,
    avatarUrl: dto.avatarUrl,
    departmentId: typeof dept === 'object' ? dept._id : dept,
    departmentName: typeof dept === 'object' ? dept.name : undefined,
    designation: dto.designation,
    employmentType: dto.employmentType,
    joinDate: dto.dateOfJoining,
    status: dto.status,
    isActive: dto.status === 'active',
    salaryStructure:
      typeof structure === 'object' ? mapSalaryStructure(structure) : undefined,
  };
}

export function mapPayroll(dto: ApiPayroll): PayrollRun {
  return {
    id: dto._id,
    period: periodToString(dto.period),
    status: dto.status,
    totalEmployees: dto.employeeCount,
    totalGross: dto.totalGross,
    totalDeductions: dto.totalDeductions,
    totalNet: dto.totalNet,
    processedAt: dto.processedAt,
    createdAt: dto.createdAt ?? '',
  };
}

export function mapSalarySlip(dto: ApiSalarySlip): SalarySlip {
  const emp = dto.employeeId;
  return {
    id: dto._id,
    payrollRunId: dto.payrollId,
    employeeId: typeof emp === 'object' ? emp._id : emp,
    employee:
      typeof emp === 'object'
        ? ({
            id: emp._id,
            employeeCode: emp.employeeCode,
            name: `${emp.firstName} ${emp.lastName}`.trim(),
            email: '',
            departmentId: '',
            designation: emp.designation,
            employmentType: 'full_time',
            joinDate: '',
            status: 'active',
            isActive: true,
          } as Employee)
        : undefined,
    period: periodToString(dto.period),
    grossSalary: dto.grossSalary,
    totalDeductions: dto.totalDeductions,
    netSalary: dto.netSalary,
    allowances: (dto.allowances ?? []).map((a) => ({ label: a.name, amount: a.amount })),
    deductions: (dto.deductions ?? []).map((d) => ({ label: d.name, amount: d.amount })),
    paymentStatus: dto.paymentStatus,
    paidOn: dto.paidOn,
    pdfUrl: dto.pdfUrl,
  };
}

export function mapOverview(dto: ApiDashboardOverview): DashboardStats {
  const counts: Record<string, number> = {};
  for (const entry of dto.invoiceStatusCounts ?? []) {
    counts[entry._id] = entry.count;
  }
  return {
    totalRevenue: dto.totalRevenue,
    outstandingAmount: dto.totalOutstanding,
    invoiceCount: {
      draft: counts.draft ?? 0,
      sent: (counts.sent ?? 0) + (counts.partially_paid ?? 0),
      paid: counts.paid ?? 0,
      overdue: counts.overdue ?? 0,
    },
    payrollExpenseThisMonth: dto.payrollExpenseThisMonth,
    activeEmployees: dto.activeEmployees,
  };
}

function trendLabel(point: ApiTrendPoint): string {
  return MONTH_LABELS[(point._id.month - 1 + 12) % 12];
}

/** Merge revenue and payroll trends into the revenue-vs-expense chart series. */
export function mapRevenueTrend(
  revenue: ApiTrendPoint[],
  payroll: ApiTrendPoint[],
): RevenuePoint[] {
  const expenseByKey = new Map<string, number>();
  for (const p of payroll) {
    expenseByKey.set(`${p._id.year}-${p._id.month}`, p.totalNet ?? 0);
  }
  return revenue.map((p) => ({
    month: trendLabel(p),
    revenue: p.revenue ?? 0,
    expense: expenseByKey.get(`${p._id.year}-${p._id.month}`) ?? 0,
  }));
}

export function mapPayrollTrend(points: ApiTrendPoint[]): PayrollTrendPoint[] {
  return points.map((p) => ({ month: trendLabel(p), amount: p.totalNet ?? 0 }));
}

export function mapOutstandingClient(dto: ApiOutstandingClient): OutstandingClient {
  return {
    clientId: dto._id,
    name: dto.name,
    companyName: dto.companyNameOfClient,
    outstanding: dto.totalOutstanding,
    totalInvoiced: dto.totalInvoiced,
  };
}
