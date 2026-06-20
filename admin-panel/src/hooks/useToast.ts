import { useToastStore } from '@/components/ui/Toast/toast.store';

export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    success: (message: string, description?: string) =>
      push({ tone: 'success', message, description }),
    error: (message: string, description?: string) => push({ tone: 'error', message, description }),
    info: (message: string, description?: string) => push({ tone: 'info', message, description }),
    warning: (message: string, description?: string) =>
      push({ tone: 'warning', message, description }),
  };
}
