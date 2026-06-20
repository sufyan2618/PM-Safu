import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Checkbox } from '../Checkbox';
import { Pagination } from '../Pagination';
import { TableSkeleton } from './TableSkeleton';
import type { Column, DataTableProps } from './Table.types';

function alignClass(align?: 'left' | 'right' | 'center') {
  return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
}

function cellValue<T>(row: T, column: Column<T>) {
  if (column.render) return column.render(row);
  return (row as Record<string, unknown>)[column.key as string] as React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyState,
  rowKey,
  onRowClick,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  pagination,
  footerRow,
  sortBy,
  sortOrder,
  onSortChange,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedKeys.length === data.length;
  const someSelected = selectedKeys.length > 0 && !allSelected;

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : data.map(rowKey));
  }

  function toggleRow(key: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedKeys.includes(key) ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key],
    );
  }

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-subtle bg-surface">
        <TableSkeleton cols={columns.length + (selectable ? 1 : 0)} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-subtle bg-surface">
        {emptyState ?? (
          <p className="px-4 py-12 text-center text-body-sm text-ink-400">No records found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-subtle bg-surface md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-subtle bg-sunken">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column) => {
                const isSorted = sortBy === column.key;
                return (
                  <th
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className={cn(
                      'px-4 py-3 text-caption font-medium uppercase tracking-[0.02em] text-ink-600',
                      alignClass(column.align),
                    )}
                  >
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(String(column.key))}
                        className={cn(
                          'inline-flex items-center gap-1 transition-colors hover:text-ink-900',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp size={13} strokeWidth={2} />
                          ) : (
                            <ArrowDown size={13} strokeWidth={2} />
                          )
                        ) : (
                          <ChevronsUpDown size={13} strokeWidth={2} className="text-ink-400" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const key = rowKey(row);
              const selected = selectedKeys.includes(key);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-subtle transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-sunken/60',
                    selected && 'bg-accent-100/40',
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected} onChange={() => toggleRow(key)} />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-4 py-3.5 text-body-sm text-ink-900',
                        alignClass(column.align),
                        column.isMono && 'font-data',
                      )}
                    >
                      {cellValue(row, column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          {footerRow && (
            <tfoot>
              <tr className="border-t border-accent-600/20 bg-sunken/40">{footerRow}</tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => {
          const key = rowKey(row);
          return (
            <div
              key={key}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'rounded-xl border border-subtle bg-surface p-4',
                onRowClick && 'cursor-pointer active:bg-sunken/60',
              )}
            >
              {columns.map((column) => (
                <div
                  key={String(column.key)}
                  className="flex items-center justify-between gap-4 py-1.5"
                >
                  <span className="text-caption uppercase tracking-[0.02em] text-ink-400">
                    {column.header}
                  </span>
                  <span
                    className={cn(
                      'text-right text-body-sm text-ink-900',
                      column.isMono && 'font-data',
                    )}
                  >
                    {cellValue(row, column)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
