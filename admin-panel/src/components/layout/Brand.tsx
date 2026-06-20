import { cn } from '@/lib/cn';

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-600 text-white">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            d="M6 8h12M6 12h12M6 16h7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!collapsed && (
        <div className="leading-tight">
          <p className={cn('text-body font-semibold text-ink-900')}>Ledger</p>
          <p className="text-caption text-ink-400">Platform Console</p>
        </div>
      )}
    </div>
  );
}
