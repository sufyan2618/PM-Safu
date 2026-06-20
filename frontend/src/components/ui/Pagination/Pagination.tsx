import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageRange(current: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="font-data text-caption text-ink-400">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-strong text-ink-600 transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        {pageRange(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1.5 text-ink-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page}
              className={cn(
                'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-data text-body-sm transition-colors',
                p === page
                  ? 'bg-accent-600 text-white'
                  : 'border border-strong text-ink-600 hover:bg-sunken',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-strong text-ink-600 transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
