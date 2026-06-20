import type { ReactNode } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'right' | 'center';
  isMono?: boolean;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  pagination?: TablePagination;
  footerRow?: ReactNode;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
}
