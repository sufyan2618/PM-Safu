import type { QueryParams } from '@/types';

/**
 * Translate the UI's `QueryParams` (page/pageSize/sortBy/sortOrder/search + filters)
 * into the backend's expected query string (page/limit/sort/search + filters).
 */
export function toQuery(params: QueryParams = {}): Record<string, unknown> {
  const { pageSize, sortBy, sortOrder, ...rest } = params;
  const query: Record<string, unknown> = { ...rest };
  if (pageSize != null) query.limit = pageSize;
  if (sortBy) query.sort = `${sortOrder === 'desc' ? '-' : ''}${sortBy}`;
  return query;
}
