/**
 * Anti-corruption layer: translate raw API DTOs (see `dto.ts`) into the UI
 * domain types the components consume. Keeping this isolated means the rest of
 * the app is insulated from server-side naming (`_id`, populated refs, etc.).
 */
import type {
  ApiAuditLog,
  ApiClient,
  ApiCompany,
  ApiDashboardOverview,
  ApiDepartment,
  ApiEmployee,
  ApiFinancialSummary,
  ApiInvoice,
  ApiInvoiceStatusBreakdown,
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
  AuditLog,
  Client,
  Company,
  CompanySummary,
  DashboardStats,
  Department,
  Employee,
  FinancialSummary,
  Invoice,
  InvoiceStatusBreakdown,
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
    templateId: typeof dto.templateId === 'object' ? dto.templateId._id : dto.templateId,
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

import type {
  InvoiceDesign,
  InvoiceDesignBranding,
  InvoiceDesignLayout,
  InvoiceDesignSections,
  InvoiceDesignTypography,
  ItemColumn,
} from '@/types/invoice.types';

const DEFAULT_COLUMNS: ItemColumn[] = [
  { key: 'description', label: 'Description', visible: true, width: '40%' },
  { key: 'quantity', label: 'Qty', visible: true, width: '12%' },
  { key: 'unitPrice', label: 'Unit Price', visible: true, width: '16%' },
  { key: 'taxRate', label: 'Tax %', visible: true, width: '12%' },
  { key: 'discount', label: 'Disc.', visible: true, width: '10%' },
  { key: 'amount', label: 'Amount', visible: true, width: '20%' },
];

function mapDesign(dto: ApiInvoiceTemplate): InvoiceDesign {
  const b = dto.design?.branding ?? {};
  const t = dto.design?.typography ?? {};
  const l = dto.design?.layout ?? {};
  const s = dto.design?.sections ?? {};
  const w = dto.design?.watermark ?? {};

  const branding: InvoiceDesignBranding = {
    logoUrl: b.logoUrl,
    showLogo: b.showLogo ?? true,
    primaryColor: b.primaryColor ?? '#2563EB',
    secondaryColor: b.secondaryColor ?? '#1E293B',
    accentColor: b.accentColor ?? '#0EA5E9',
    backgroundColor: b.backgroundColor ?? '#FFFFFF',
    textColor: b.textColor ?? '#111111',
  };

  const layout: InvoiceDesignLayout = {
    pageSize: (l.pageSize as 'A4' | 'Letter') ?? 'A4',
    orientation: (l.orientation as 'portrait' | 'landscape') ?? 'portrait',
    margins: l.margins ?? { top: 40, right: 40, bottom: 40, left: 40 },
    headerStyle: (l.headerStyle as InvoiceDesignLayout['headerStyle']) ?? 'logo-left',
  };

  const typography: InvoiceDesignTypography = {
    fontFamily: (t.fontFamily as InvoiceDesignTypography['fontFamily']) ?? 'Inter',
    customFontUrl: t.customFontUrl,
    baseFontSize: t.baseFontSize ?? 11,
    headingFontSize: t.headingFontSize ?? 22,
  };

  const sections: InvoiceDesignSections = {
    companyInfo: { visible: s.companyInfo?.visible ?? true, order: s.companyInfo?.order ?? 1, fields: s.companyInfo?.fields ?? ['name', 'address', 'email', 'phone'] },
    clientInfo: { visible: s.clientInfo?.visible ?? true, order: s.clientInfo?.order ?? 2, label: s.clientInfo?.label ?? 'Bill To' },
    invoiceMeta: { visible: s.invoiceMeta?.visible ?? true, order: s.invoiceMeta?.order ?? 3, fields: s.invoiceMeta?.fields ?? ['invoiceNumber', 'issueDate', 'dueDate'] },
    itemsTable: {
      visible: s.itemsTable?.visible ?? true,
      order: s.itemsTable?.order ?? 4,
      columns: (s.itemsTable?.columns as ItemColumn[] | undefined) ?? DEFAULT_COLUMNS,
      zebraStripes: s.itemsTable?.zebraStripes ?? false,
      headerBackgroundColor: s.itemsTable?.headerBackgroundColor ?? '#F1F5F9',
    },
    summary: { visible: s.summary?.visible ?? true, order: s.summary?.order ?? 5, fields: s.summary?.fields ?? ['subTotal', 'tax', 'grandTotal'] },
    notes: { visible: s.notes?.visible ?? true, order: s.notes?.order ?? 6, label: s.notes?.label ?? 'Notes' },
    terms: { visible: s.terms?.visible ?? true, order: s.terms?.order ?? 7, label: s.terms?.label ?? 'Terms & Conditions' },
    paymentInstructions: { visible: s.paymentInstructions?.visible ?? false, order: s.paymentInstructions?.order ?? 8, content: s.paymentInstructions?.content ?? '' },
    signature: { visible: s.signature?.visible ?? false, order: s.signature?.order ?? 9, signatoryName: s.signature?.signatoryName, signatoryTitle: s.signature?.signatoryTitle },
    footer: { visible: s.footer?.visible ?? true, order: s.footer?.order ?? 10, content: s.footer?.content ?? 'Thank you for your business' },
  };

  return {
    layout,
    branding,
    typography,
    sections,
    watermark: { enabled: w.enabled ?? false, text: w.text ?? '', opacity: w.opacity ?? 0.1, fontSize: w.fontSize ?? 72 },
  };
}

export function mapInvoiceTemplate(dto: ApiInvoiceTemplate): InvoiceTemplate {
  return {
    id: dto._id,
    name: dto.name,
    baseTheme: dto.baseTheme,
    isDefault: dto.isDefault,
    design: mapDesign(dto),
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
    totalInvoices: dto.totalInvoices ?? 0,
    payrollExpenseThisMonth: dto.payrollExpenseThisMonth,
    activeEmployees: dto.activeEmployees,
    revenueDelta: dto.revenueDelta ?? 0,
    payrollDelta: dto.payrollDelta ?? 0,
    overdueCount: dto.overdueCount ?? counts.overdue ?? 0,
    departmentCount: dto.departmentCount ?? 0,
    newHiresThisMonth: dto.newHiresThisMonth ?? 0,
  };
}

export function mapInvoiceStatusBreakdown(
  dto: ApiInvoiceStatusBreakdown,
): InvoiceStatusBreakdown {
  return {
    status: dto._id,
    count: dto.count,
    amount: dto.totalAmount ?? 0,
    amountDue: dto.amountDue ?? 0,
  };
}

export function mapFinancialSummary(dto: ApiFinancialSummary): FinancialSummary {
  return {
    from: dto.from,
    to: dto.to,
    revenue: dto.revenue ?? 0,
    payrollExpense: dto.payrollExpense ?? 0,
    net: dto.net ?? 0,
    outstanding: dto.outstanding ?? 0,
    invoiceStatusBreakdown: (dto.invoiceStatusBreakdown ?? []).map(mapInvoiceStatusBreakdown),
    revenueSeries: (dto.revenueSeries ?? []).map((p) => ({
      month: MONTH_LABELS[(p._id.month - 1 + 12) % 12],
      revenue: p.revenue ?? 0,
      expense: 0,
    })),
    payroll: dto.payroll ?? { net: 0, gross: 0, deductions: 0 },
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

export function mapAuditLog(dto: ApiAuditLog): AuditLog {
  return {
    id: dto._id,
    actorId: dto.actorId,
    actorName: dto.actorName ?? undefined,
    actorEmail: dto.actorEmail,
    actorRole: dto.actorRole,
    action: dto.action,
    targetType: dto.targetType,
    targetId: dto.targetId,
    status: dto.status,
    statusCode: dto.statusCode,
    method: dto.method,
    path: dto.path,
    ipAddress: dto.ipAddress,
    userAgent: dto.userAgent,
    metadata: dto.metadata,
    createdAt: dto.createdAt,
  };
}
