import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'accent' | 'info' | 'warning' | 'danger' | 'neutral';
  delta?: { value: string; trend: 'up' | 'down' };
  hint?: string;
  sparkline?: number[];
  /** Hero renders larger, with a tinted background and a taller sparkline. */
  variant?: 'hero' | 'default';
}

interface SparklineProps {
  data: number[];
  tone: string;
  width?: number;
  height?: number;
}

function MiniSparkline({ data, tone, width = 56, height = 24 }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const strokeColor =
    tone === 'danger'  ? 'var(--danger-600)'  :
    tone === 'warning' ? 'var(--warn-600)'    :
    tone === 'info'    ? 'var(--info-600)'    :
                         'var(--accent-600)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="shrink-0"
    >
      <polyline
        points={points.join(' ')}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />
    </svg>
  );
}

function DeltaBadge({ delta }: { delta: { value: string; trend: 'up' | 'down' } }) {
  const up = delta.trend === 'up';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-data text-[10px] font-bold',
        up ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600',
      )}
    >
      {up ? <ArrowUpRight size={9} strokeWidth={3} /> : <ArrowDownRight size={9} strokeWidth={3} />}
      {delta.value}
    </span>
  );
}

const TONE_TEXT: Record<string, string> = {
  accent:  'text-accent-600',
  info:    'text-info-600',
  warning: 'text-warn-600',
  danger:  'text-danger-600',
  neutral: 'text-ink-400',
};

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  delta,
  hint,
  sparkline,
  variant = 'default',
}: StatTileProps) {
  const isHero = variant === 'hero';

  return (
    <Card
      className={cn(
        'flex h-full flex-col',
        isHero
          ? 'gap-4 bg-accent-50 ring-1 ring-accent-100/80 dark:bg-accent-100/[0.07] dark:ring-accent-100/20'
          : 'gap-3',
      )}
    >
      {/* Label + delta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon
            size={isHero ? 12 : 11}
            strokeWidth={2.5}
            className={cn('shrink-0', TONE_TEXT[tone])}
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-ink-400">
            {label}
          </p>
        </div>
        {delta && <DeltaBadge delta={delta} />}
      </div>

      {/* Value */}
      <p
        className={cn(
          'font-data font-bold leading-none text-ink-900',
          isHero ? 'text-[2.25rem] tracking-[-0.02em]' : 'text-data-lg',
        )}
      >
        {value}
      </p>

      {/* Sparkline + hint */}
      <div className={cn('mt-auto flex items-end', isHero ? 'justify-between gap-4' : 'gap-2')}>
        {hint && (
          <p className={cn('text-[10px] font-medium text-ink-400', isHero ? '' : 'truncate')}>
            {hint}
          </p>
        )}
        {sparkline && sparkline.length >= 2 && (
          <MiniSparkline
            data={sparkline}
            tone={tone}
            width={isHero ? 96 : 52}
            height={isHero ? 32 : 22}
          />
        )}
      </div>
    </Card>
  );
}
