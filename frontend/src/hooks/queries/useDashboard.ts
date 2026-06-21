import { useQuery } from '@tanstack/react-query';
import { dashboardService, type DateRange } from '@/api/services/dashboard.service';
export type { CashFlowForecastData, CashFlowBucket } from '@/api/services/dashboard.service';

export function useDashboardOverview() {
  return useQuery({ queryKey: ['dashboard', 'overview'], queryFn: dashboardService.overview });
}

export function useRevenueTrend() {
  return useQuery({ queryKey: ['dashboard', 'revenue'], queryFn: dashboardService.revenueTrend });
}

export function usePayrollTrend() {
  return useQuery({ queryKey: ['dashboard', 'payroll'], queryFn: dashboardService.payrollTrend });
}

export function useOutstandingClients() {
  return useQuery({
    queryKey: ['dashboard', 'outstanding'],
    queryFn: dashboardService.outstandingClients,
  });
}

export function useInvoiceStatusBreakdown() {
  return useQuery({
    queryKey: ['dashboard', 'status-breakdown'],
    queryFn: dashboardService.invoiceStatusBreakdown,
  });
}

export function useFinancialSummary(range: DateRange) {
  return useQuery({
    queryKey: ['dashboard', 'financial-summary', range],
    queryFn: () => dashboardService.financialSummary(range),
  });
}

export function useArAging() {
  return useQuery({ queryKey: ['dashboard', 'ar-aging'], queryFn: dashboardService.arAging });
}

export function useCollectionMetrics(range: DateRange = {}) {
  return useQuery({
    queryKey: ['dashboard', 'collection-metrics', range],
    queryFn: () => dashboardService.collectionMetrics(range),
  });
}

export function useRevenueByClient(range: DateRange = {}, limit = 8) {
  return useQuery({
    queryKey: ['dashboard', 'revenue-by-client', range, limit],
    queryFn: () => dashboardService.revenueByClient(range, limit),
  });
}

export function usePayrollByDepartment(range: DateRange = {}) {
  return useQuery({
    queryKey: ['dashboard', 'payroll-by-department', range],
    queryFn: () => dashboardService.payrollByDepartment(range),
  });
}

export function useCashFlowForecast() {
  return useQuery({
    queryKey: ['dashboard', 'cash-flow-forecast'],
    queryFn: dashboardService.cashFlowForecast,
    staleTime: 5 * 60 * 1000,
  });
}
