import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapAuditLog, toPaginated } from '../mappers';
import { toQuery } from '../query';
import type { ApiAuditLog } from '../dto';
import type { ApiEnvelope, AuditLog, Paginated, QueryParams } from '@/types';

export interface AuditListParams extends QueryParams {
  action?: string;
  status?: string;
  actorId?: string;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const auditService = {
  async list(params: AuditListParams = {}): Promise<Paginated<AuditLog>> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiAuditLog[]>>(ENDPOINTS.auditLogs.list, {
      params: toQuery(params),
    });
    return toPaginated(data, mapAuditLog);
  },

  async actions(): Promise<string[]> {
    const { data } = await axiosClient.get<ApiEnvelope<string[]>>(ENDPOINTS.auditLogs.actions);
    return data.data;
  },
};
