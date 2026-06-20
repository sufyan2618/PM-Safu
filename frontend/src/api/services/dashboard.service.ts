import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import {
  mapFinancialSummary,
  mapInvoiceStatusBreakdown,
  mapOutstandingClient,
  mapOverview,
  mapPayrollTrend,
  mapRevenueTrend,
} from '../mappers';
import type {
  ApiDashboardOverview,
  ApiFinancialSummary,
  ApiInvoiceStatusBreakdown,
  ApiOutstandingClient,
  ApiTrendPoint,
} from '../dto';
import type {
  ApiEnvelope,
  DashboardStats,
  FinancialSummary,
  InvoiceStatusBreakdown,
  OutstandingClient,
  PayrollTrendPoint,
  RevenuePoint,
} from '@/types';

export interface DateRange {
  from?: string;
  to?: string;
}

export const dashboardService = {
  async overview(): Promise<DashboardStats> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiDashboardOverview>>(
      ENDPOINTS.dashboard.overview,
    );
    return mapOverview(data.data);
  },

  async revenueTrend(): Promise<RevenuePoint[]> {
    const [revenue, payroll] = await Promise.all([
      axiosClient.get<ApiEnvelope<ApiTrendPoint[]>>(ENDPOINTS.dashboard.revenueTrend, {
        params: { months: 8 },
      }),
      axiosClient.get<ApiEnvelope<ApiTrendPoint[]>>(ENDPOINTS.dashboard.payrollTrend, {
        params: { months: 8 },
      }),
    ]);
    return mapRevenueTrend(revenue.data.data, payroll.data.data);
  },

  async payrollTrend(): Promise<PayrollTrendPoint[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiTrendPoint[]>>(
      ENDPOINTS.dashboard.payrollTrend,
      { params: { months: 6 } },
    );
    return mapPayrollTrend(data.data);
  },

  async outstandingClients(): Promise<OutstandingClient[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiOutstandingClient[]>>(
      ENDPOINTS.dashboard.outstandingClients,
    );
    return data.data.map(mapOutstandingClient);
  },

  async invoiceStatusBreakdown(): Promise<InvoiceStatusBreakdown[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiInvoiceStatusBreakdown[]>>(
      ENDPOINTS.dashboard.statusBreakdown,
    );
    return data.data.map(mapInvoiceStatusBreakdown);
  },

  async financialSummary(range: DateRange = {}): Promise<FinancialSummary> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiFinancialSummary>>(
      ENDPOINTS.dashboard.financialSummary,
      { params: range },
    );
    return mapFinancialSummary(data.data);
  },

  async downloadReportPdf(range: DateRange = {}, filename = 'financial-report.pdf'): Promise<void> {
    const { data } = await axiosClient.get<Blob>(ENDPOINTS.dashboard.reportExport, {
      params: { ...range, format: 'pdf' },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
