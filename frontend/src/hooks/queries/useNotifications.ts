import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/api/services/notification.service';

const QUERY_KEY = ['notifications'];

export function useNotifications(limit = 30) {
  return useQuery({
    queryKey: [...QUERY_KEY, limit],
    queryFn: () => notificationService.getNotifications(limit),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markOneRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
