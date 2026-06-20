import type { InvoiceStatus } from './invoice.types';

export interface DashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  invoiceCount: { draft: number; sent: number; paid: number; overdue: number };
  payrollExpenseThisMonth: number;
  activeEmployees: number;
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
}

export interface PayrollTrendPoint {
  month: string;
  amount: number;
}

export interface OutstandingClient {
  clientId: string;
  name: string;
  outstanding: number;
  invoiceCount: number;
}
