export type AuditStatus = 'success' | 'failed';

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  status: AuditStatus;
  statusCode?: number;
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
