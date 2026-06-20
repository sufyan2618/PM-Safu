import { cn } from '@/utils/cn';

interface BrandProps {
  collapsed?: boolean;
  className?: string;
}

/** The Ledger wordmark — stacked rules reference ledger ruling. */
export function Brand({ collapsed = false, className }: BrandProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-600">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M3 4.5h12M3 9h12M3 13.5h7" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </span>
      {!collapsed && (
        <span className="text-heading font-semibold tracking-tight text-ink-900">Ledger</span>
      )}
    </div>
  );
}
