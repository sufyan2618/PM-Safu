import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapOutstandingClient, mapOverview, mapPayrollTrend, mapRevenueTrend } from '../mappers';
import type { ApiDashboardOverview, ApiOutstandingClient, ApiTrendPoint } from '../dto';
import type {
  ApiEnvelope,
  DashboardStats,
  OutstandingClient,
  PayrollTrendPoint,
  RevenuePoint,
} from '@/types';

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
};
