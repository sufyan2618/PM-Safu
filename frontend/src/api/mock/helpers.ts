import type { Paginated, QueryParams } from '@/types';

export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

interface PaginateOptions<T> {
  searchFields?: (keyof T)[];
}

/** Apply client-side search, sort and pagination to a mock collection. */
export function paginate<T>(
  items: T[],
  params: QueryParams = {},
  { searchFields = [] }: PaginateOptions<T> = {},
): Paginated<T> {
  const { page = 1, pageSize = 10, search, sortBy, sortOrder = 'asc' } = params;
  let result = [...items];

  if (search && searchFields.length) {
    const q = search.toLowerCase();
    result = result.filter((item) =>
      searchFields.some((field) =>
        String((item as Record<string, unknown>)[field as string] ?? '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }

  if (sortBy) {
    result.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy];
      const bv = (b as Record<string, unknown>)[sortBy];
      if (av === bv) return 0;
      const cmp = (av as number | string) > (bv as number | string) ? 1 : -1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }

  const total = result.length;
  const start = (page - 1) * pageSize;
  const paged = result.slice(start, start + pageSize);

  return {
    items: paged,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
