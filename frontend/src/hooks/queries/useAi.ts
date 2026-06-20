import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/api/services/ai.service';
import type { AiChatMessage } from '@/types';

/** Whether AI features are configured on the server (drives showing/hiding AI affordances). */
export function useAiStatus() {
  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: aiService.status,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useInvoiceDraft() {
  return useMutation({
    mutationFn: (payload: { prompt: string; clientId?: string; dueDate?: string }) =>
      aiService.invoiceDraft(payload),
  });
}

export function useDescribeItem() {
  return useMutation({
    mutationFn: (payload: { name: string; hours?: number; context?: string }) =>
      aiService.describeItem(payload),
  });
}

export function usePayrollInsights(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['ai', 'payroll-insights', id],
    queryFn: () => aiService.payrollInsights(id as string),
    enabled: !!id && enabled,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRefreshPayrollInsights(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiService.payrollInsights(id as string, true),
    onSuccess: (data) => qc.setQueryData(['ai', 'payroll-insights', id], data),
  });
}

export function usePayrollChat() {
  return useMutation({
    mutationFn: (payload: { messages: AiChatMessage[]; payrollId?: string }) =>
      aiService.payrollChat(payload),
  });
}
