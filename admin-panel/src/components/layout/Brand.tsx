import { cn } from '@/lib/cn';

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.webp"
        alt="PM-Safu"
        className="h-8 w-8 shrink-0 rounded-lg object-contain"
      />
      {!collapsed && (
        <div className="leading-tight">
          <p className={cn('text-body font-semibold text-ink-900')}>PM-Safu</p>
          <p className="text-caption text-ink-400">Platform Console</p>
        </div>
      )}
    </div>
  );
}
