import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salarySlipService } from '@/api/services/salarySlip.service';
import type { QueryParams } from '@/types';

interface SlipListParams extends QueryParams {
  period?: string;
  paymentStatus?: string;
  employeeId?: string;
}

export function useSalarySlips(params: SlipListParams = {}) {
  return useQuery({
    queryKey: ['salary-slips', params],
    queryFn: () => salarySlipService.list(params),
  });
}

export function useSalarySlip(id: string | undefined) {
  return useQuery({
    queryKey: ['salary-slip', id],
    queryFn: () => salarySlipService.detail(id!),
    enabled: !!id,
  });
}

export function useMarkSlipPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salarySlipService.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary-slips'] }),
  });
}
