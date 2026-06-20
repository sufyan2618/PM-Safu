import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay } from '../mock/helpers';
import {
  mockDashboardStats,
  mockOutstandingClients,
  mockPayrollTrend,
  mockRevenueTrend,
} from '../mock/mockData';
import type {
  ApiResponse,
  DashboardStats,
  OutstandingClient,
  PayrollTrendPoint,
  RevenuePoint,
} from '@/types';

export const dashboardService = {
  async overview(): Promise<DashboardStats> {
    if (USE_MOCKS) return delay(mockDashboardStats);
    const { data } = await axiosClient.get<ApiResponse<DashboardStats>>(
      ENDPOINTS.dashboard.overview,
    );
    return data.data;
  },

  async revenueTrend(): Promise<RevenuePoint[]> {
    if (USE_MOCKS) return delay(mockRevenueTrend);
    const { data } = await axiosClient.get<ApiResponse<RevenuePoint[]>>(
      ENDPOINTS.dashboard.revenueTrend,
    );
    return data.data;
  },

  async payrollTrend(): Promise<PayrollTrendPoint[]> {
    if (USE_MOCKS) return delay(mockPayrollTrend);
    const { data } = await axiosClient.get<ApiResponse<PayrollTrendPoint[]>>(
      ENDPOINTS.dashboard.payrollTrend,
    );
    return data.data;
  },

  async outstandingClients(): Promise<OutstandingClient[]> {
    if (USE_MOCKS) return delay(mockOutstandingClients);
    const { data } = await axiosClient.get<ApiResponse<OutstandingClient[]>>(
      ENDPOINTS.dashboard.outstandingClients,
    );
    return data.data;
  },
};
