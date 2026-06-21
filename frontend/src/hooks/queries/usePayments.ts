import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentService } from '@/api/services/payment.service';

export function useConnectStatus(enabled = true) {
  return useQuery({
    queryKey: ['payments', 'connect-status'],
    queryFn: paymentService.connectStatus,
    enabled,
  });
}

export function useStartOnboarding() {
  return useMutation({ mutationFn: () => paymentService.startOnboarding() });
}
