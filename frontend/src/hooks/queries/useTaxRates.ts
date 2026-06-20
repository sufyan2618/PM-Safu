import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taxRateService, type TaxRatePayload } from '@/api/services/taxRate.service';

const KEY = ['tax-rates'];

export function useTaxRates() {
  return useQuery({ queryKey: KEY, queryFn: taxRateService.list });
}

export function useCreateTaxRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaxRatePayload) => taxRateService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTaxRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaxRatePayload> }) =>
      taxRateService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTaxRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxRateService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
