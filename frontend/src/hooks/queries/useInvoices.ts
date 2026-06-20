import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/api/services/invoice.service';
import type { InvoiceStatus, QueryParams } from '@/types';
import type { InvoiceFormValues } from '@/constants/validation.constants';

interface InvoiceListParams extends QueryParams {
  status?: InvoiceStatus;
  clientId?: string;
}

export function useInvoices(params: InvoiceListParams = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoiceService.list(params),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.detail(id!),
    enabled: !!id,
  });
}

export function useSharedInvoice(token: string | undefined) {
  return useQuery({
    queryKey: ['invoice', 'share', token],
    queryFn: () => invoiceService.byShareToken(token!),
    enabled: !!token,
  });
}

export function useInvoiceTemplates() {
  return useQuery({ queryKey: ['invoice-templates'], queryFn: invoiceService.templates });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceFormValues) => invoiceService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceFormValues) => invoiceService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });
}

export function useInvoiceActions(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['invoices'] });
    qc.invalidateQueries({ queryKey: ['invoice', id] });
  };
  return {
    send: useMutation({ mutationFn: () => invoiceService.send(id), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: () => invoiceService.remove(id), onSuccess: invalidate }),
    recordPayment: useMutation({
      mutationFn: (payload: { amount: number; method: string; reference?: string }) =>
        invoiceService.recordPayment(id, payload),
      onSuccess: invalidate,
    }),
  };
}
