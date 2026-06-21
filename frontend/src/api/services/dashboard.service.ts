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
  ArAging,
  CollectionMetrics,
  DashboardStats,
  FinancialSummary,
  InvoiceStatusBreakdown,
  OutstandingClient,
  PayrollByDepartment,
  PayrollTrendPoint,
  RevenueByClient,
  RevenuePoint,
} from '@/types';

export interface DateRange {
  from?: string;
  to?: string;
}

export interface CashFlowBucket {
  confirmed: number;
  atRisk: number;
  total: number;
}

export interface CashFlowForecastData {
  next30: CashFlowBucket;
  next60: CashFlowBucket;
  next90: CashFlowBucket;
  totalNext90: number;
  totalNext30: number;
  beyond90: number;
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

  async arAging(): Promise<ArAging> {
    const { data } = await axiosClient.get<ApiEnvelope<ArAging>>(ENDPOINTS.dashboard.arAging);
    return data.data;
  },

  async collectionMetrics(range: DateRange = {}): Promise<CollectionMetrics> {
    const { data } = await axiosClient.get<ApiEnvelope<CollectionMetrics>>(
      ENDPOINTS.dashboard.collectionMetrics,
      { params: range },
    );
    return data.data;
  },

  async revenueByClient(range: DateRange = {}, limit = 8): Promise<RevenueByClient[]> {
    const { data } = await axiosClient.get<ApiEnvelope<RevenueByClient[]>>(
      ENDPOINTS.dashboard.revenueByClient,
      { params: { ...range, limit } },
    );
    return data.data;
  },

  async payrollByDepartment(range: DateRange = {}): Promise<PayrollByDepartment[]> {
    const { data } = await axiosClient.get<ApiEnvelope<PayrollByDepartment[]>>(
      ENDPOINTS.dashboard.payrollByDepartment,
      { params: range },
    );
    return data.data;
  },

  async cashFlowForecast(): Promise<CashFlowForecastData> {
    const { data } = await axiosClient.get<ApiEnvelope<CashFlowForecastData>>(
      ENDPOINTS.dashboard.cashFlowForecast,
    );
    return data.data;
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
