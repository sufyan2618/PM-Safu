import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/api/services/dashboard.service';

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
