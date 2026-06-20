import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'accent' | 'info' | 'warning' | 'danger';
  delta?: { value: string; trend: 'up' | 'down' };
  hint?: string;
}

const TONE_CLASSES = {
  accent: 'bg-accent-100 text-accent-600',
  info: 'bg-info-100 text-info-600',
  warning: 'bg-warn-100 text-warn-600',
  danger: 'bg-danger-100 text-danger-600',
};

export function StatTile({ label, value, icon: Icon, tone = 'accent', delta, hint }: StatTileProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            TONE_CLASSES[tone],
          )}
        >
          <Icon size={20} strokeWidth={1.5} />
        </span>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-data text-caption font-medium',
              delta.trend === 'up' ? 'text-success-600' : 'text-danger-600',
            )}
          >
            {delta.trend === 'up' ? (
              <ArrowUpRight size={13} strokeWidth={2} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2} />
            )}
            {delta.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-caption uppercase tracking-[0.02em] text-ink-400">{label}</p>
        <p className="mt-1 font-data text-data-lg text-ink-900">{value}</p>
        {hint && <p className="mt-1 text-caption text-ink-400">{hint}</p>}
      </div>
    </Card>
  );
}
