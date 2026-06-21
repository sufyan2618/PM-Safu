import { useState } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCashFlowForecast } from '@/hooks/queries/useDashboard';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  confirmed: number;
  atRisk: number;
  total: number;
}

interface BandBarProps {
  label: string;
  confirmed: number;
  atRisk: number;
  total: number;
  maxTotal: number;
  currency: string;
  onHover: (state: TooltipState | null, e?: React.MouseEvent) => void;
}

function BandBar({ label, confirmed, atRisk, total, maxTotal, currency, onHover }: BandBarProps) {
  const confirmedPct = maxTotal > 0 ? (confirmed / maxTotal) * 100 : 0;
  const atRiskPct = maxTotal > 0 ? (atRisk / maxTotal) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-caption font-medium text-ink-600">{label}</span>
        <span className="font-data text-caption font-semibold text-ink-900">
          {formatCompactCurrency(total, currency)}
        </span>
      </div>
      <div
        className="relative h-6 w-full overflow-hidden rounded-md bg-sunken"
        onMouseMove={(e) =>
          onHover(
            { visible: true, x: e.clientX, y: e.clientY, label, confirmed, atRisk, total },
            e,
          )
        }
        onMouseLeave={() => onHover(null)}
      >
        {total === 0 ? (
          <div className="flex h-full items-center pl-2">
            <span className="text-[10px] text-ink-300">No invoices due</span>
          </div>
        ) : (
          <>
            {confirmedPct > 0 && (
              <div
                className="absolute left-0 top-0 h-full bg-success-500 transition-all"
                style={{ width: `${confirmedPct}%` }}
              />
            )}
            {atRiskPct > 0 && (
              <div
                className="absolute top-0 h-full bg-danger-500 transition-all"
                style={{ left: `${confirmedPct}%`, width: `${atRiskPct}%` }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function CashFlowForecast() {
  const { data, isLoading } = useCashFlowForecast();
  const currency = useAuthStore((s) => s.company?.currency ?? 'USD');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Cash Flow Forecast" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3 rounded" />
          <Skeleton className="h-6 w-full rounded" />
          <Skeleton className="h-6 w-full rounded" />
          <Skeleton className="h-6 w-full rounded" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { next30, next60, next90, totalNext90, totalNext30 } = data;
  const maxTotal = Math.max(next30.total, next60.total, next90.total, 1);
  const hasAnyAtRisk = next30.atRisk + next60.atRisk + next90.atRisk > 0;

  const bands = [
    { label: 'Next 30 days', ...next30 },
    { label: '31 – 60 days', ...next60 },
    { label: '61 – 90 days', ...next90 },
  ];

  return (
    <Card className="relative overflow-visible">
      <CardHeader
        title="Cash Flow Forecast"
        action={
          <span className="flex items-center gap-1 rounded-full bg-info-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-info-700">
            <TrendingUp size={10} strokeWidth={2.5} />
            90-day outlook
          </span>
        }
      />

      {/* Summary headline */}
      <div className="mb-5 rounded-lg bg-accent-50 px-4 py-3 ring-1 ring-accent-100/70 dark:bg-accent-100/[0.07] dark:ring-accent-100/20">
        <p className="text-body-sm text-ink-600">
          You expect to collect{' '}
          <span className="font-data font-semibold text-ink-900">
            {formatCurrency(totalNext90, { currency, compact: false })}
          </span>{' '}
          in the next 90 days based on open invoices.
          {totalNext30 > 0 && (
            <>
              {' '}
              <span className="font-semibold text-success-600">
                {formatCurrency(totalNext30, { currency })}
              </span>{' '}
              is due within 30 days.
            </>
          )}
        </p>
        {hasAnyAtRisk && (
          <p className="mt-1.5 flex items-center gap-1.5 text-caption text-danger-600">
            <AlertTriangle size={12} strokeWidth={2} />
            Some invoices are overdue and marked at-risk.
          </p>
        )}
      </div>

      {/* Stacked bars */}
      <div className="space-y-4">
        {bands.map((band) => (
          <BandBar
            key={band.label}
            label={band.label}
            confirmed={band.confirmed}
            atRisk={band.atRisk}
            total={band.total}
            maxTotal={maxTotal}
            currency={currency}
            onHover={(state) => setTooltip(state)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 border-t border-subtle pt-3">
        <span className="flex items-center gap-1.5 text-caption text-ink-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-success-500" />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5 text-caption text-ink-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-danger-500" />
          At risk / Overdue
        </span>
        <span className="flex items-center gap-1.5 text-caption text-ink-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-sunken ring-1 ring-subtle" />
          None
        </span>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className={cn(
            'pointer-events-none fixed z-50 rounded-lg border border-subtle bg-surface px-3 py-2 shadow-popover',
          )}
          style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
        >
          <p className="mb-1 text-caption font-semibold text-ink-900">{tooltip.label}</p>
          <div className="space-y-0.5 text-caption">
            <div className="flex items-center justify-between gap-6">
              <span className="text-success-600">Confirmed</span>
              <span className="font-data font-medium">
                {formatCurrency(tooltip.confirmed, { currency })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-danger-600">At risk</span>
              <span className="font-data font-medium">
                {formatCurrency(tooltip.atRisk, { currency })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 border-t border-subtle pt-0.5">
              <span className="font-medium text-ink-900">Total</span>
              <span className="font-data font-semibold text-ink-900">
                {formatCurrency(tooltip.total, { currency })}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
