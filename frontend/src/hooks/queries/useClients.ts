import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientService } from '@/api/services/client.service';
import type { QueryParams } from '@/types';
import type { ClientFormValues } from '@/constants/validation.constants';

export function useClients(params: QueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientService.list(params),
    enabled,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.detail(id!),
    enabled: !!id,
  });
}

export function useClientInvoices(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id, 'invoices'],
    queryFn: () => clientService.invoices(id!),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientFormValues) => clientService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ClientFormValues>) => clientService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['client', id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
