import { cn } from '@/utils/cn';

interface BrandProps {
  collapsed?: boolean;
  className?: string;
}

/** The PM-Safu wordmark. */
export function Brand({ collapsed = false, className }: BrandProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/logo.webp"
        alt="PM-Safu"
        className="h-8 w-8 shrink-0 rounded-lg object-contain"
      />
      {!collapsed && (
        <span className="text-heading font-semibold tracking-tight text-ink-900">PM-Safu</span>
      )}
    </div>
  );
}
