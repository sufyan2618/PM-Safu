import { Skeleton } from '../Skeleton';
import { cn } from '@/utils/cn';

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="flex gap-4 border-b border-subtle bg-sunken px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3', i === 0 ? 'w-40' : 'flex-1')} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-subtle px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-40' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}
