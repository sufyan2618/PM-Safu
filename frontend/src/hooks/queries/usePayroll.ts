import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/api/services/payroll.service';
import type { QueryParams } from '@/types';

export function usePayrollRuns(params: QueryParams = {}) {
  return useQuery({ queryKey: ['payroll', params], queryFn: () => payrollService.list(params) });
}

export function usePayrollRun(id: string | undefined) {
  return useQuery({
    queryKey: ['payroll', 'run', id],
    queryFn: () => payrollService.detail(id!),
    enabled: !!id,
  });
}

export function usePayrollSlips(id: string | undefined) {
  return useQuery({
    queryKey: ['payroll', 'run', id, 'slips'],
    queryFn: () => payrollService.slips(id!),
    enabled: !!id,
  });
}

export function useProcessPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { period: string; employeeIds?: string[] }) =>
      payrollService.process(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  });
}
