import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminService } from '@/api/services';
import type { CompanyListParams } from '@/types';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  companies: (params: CompanyListParams) => ['companies', params] as const,
  company: (id: string) => ['company', id] as const,
  companyUsers: (id: string) => ['company', id, 'users'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => superAdminService.dashboard(),
  });
}

export function useCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: queryKeys.companies(params),
    queryFn: () => superAdminService.listCompanies(params),
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.company(id),
    queryFn: () => superAdminService.getCompany(id),
    enabled: Boolean(id),
  });
}

export function useCompanyUsers(id: string) {
  return useQuery({
    queryKey: queryKeys.companyUsers(id),
    queryFn: () => superAdminService.listCompanyUsers(id),
    enabled: Boolean(id),
  });
}

/** Invalidate all queries touched by a company status change. */
function useCompanyMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  id?: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (id) queryClient.invalidateQueries({ queryKey: queryKeys.company(id) });
    },
  });
}

export function useApproveCompany(id?: string) {
  return useCompanyMutation((companyId: string) => superAdminService.approve(companyId), id);
}

export function useRejectCompany(id?: string) {
  return useCompanyMutation(
    (vars: { id: string; reason: string }) => superAdminService.reject(vars.id, vars.reason),
    id,
  );
}

export function useSuspendCompany(id?: string) {
  return useCompanyMutation((companyId: string) => superAdminService.suspend(companyId), id);
}

export function useReactivateCompany(id?: string) {
  return useCompanyMutation((companyId: string) => superAdminService.reactivate(companyId), id);
}
