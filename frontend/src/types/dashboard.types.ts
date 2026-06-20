import type { InvoiceStatus } from './invoice.types';

export interface DashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  invoiceCount: { draft: number; sent: number; paid: number; overdue: number };
  totalInvoices: number;
  payrollExpenseThisMonth: number;
  activeEmployees: number;
  revenueDelta: number;
  payrollDelta: number;
  overdueCount: number;
  departmentCount: number;
  newHiresThisMonth: number;
}

export interface RevenuePoint {
  month: string; // e.g. "Jan"
  revenue: number;
  expense: number;
}

export interface InvoiceStatusBreakdown {
  status: InvoiceStatus;
  count: number;
  amount: number;
  amountDue: number;
}

export interface FinancialSummary {
  from: string;
  to: string;
  revenue: number;
  payrollExpense: number;
  net: number;
  outstanding: number;
  invoiceStatusBreakdown: InvoiceStatusBreakdown[];
  revenueSeries: RevenuePoint[];
  payroll: { net: number; gross: number; deductions: number };
}

export interface PayrollTrendPoint {
  month: string;
  amount: number;
}

export interface OutstandingClient {
  clientId: string;
  name: string;
  companyName?: string;
  outstanding: number;
  totalInvoiced?: number;
}
