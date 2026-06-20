import { useMemo, useState } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePagination({ initialPage = 1, pageSize = 10 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(pageSize);

  return useMemo(
    () => ({
      page,
      pageSize: size,
      setPage,
      setPageSize: setSize,
      reset: () => setPage(1),
    }),
    [page, size],
  );
}
