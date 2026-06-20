import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditService, type AuditListParams } from '@/api/services/audit.service';

export function useAuditLogs(params: AuditListParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditActions() {
  return useQuery({ queryKey: ['audit-actions'], queryFn: auditService.actions });
}
