import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import type { RevenuePoint } from '@/types';
import { cn } from '@/utils/cn';

type Range = '3m' | '6m' | '8m' | '12m';

const RANGES: { label: string; value: Range }[] = [
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '8M', value: '8m' },
  { label: 'YTD', value: '12m' },
];

function ChartLegend() {
  return (
    <div className="mb-3 flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="block h-2 w-5 rounded-full bg-accent-600" />
        <span className="text-caption text-ink-400">Revenue</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="20" height="8" viewBox="0 0 20 8">
          <line
            x1="0" y1="4" x2="20" y2="4"
            stroke="var(--danger-600)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        </svg>
        <span className="text-caption text-ink-400">Expense</span>
      </div>
    </div>
  );
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [range, setRange] = useState<Range>('8m');

  const sliced = range === '3m'
    ? data.slice(-3)
    : range === '6m'
      ? data.slice(-6)
      : range === '12m'
        ? data
        : data.slice(-8);

  const netCashFlow = sliced.reduce(
    (acc, d) => acc + d.revenue - d.expense,
    0,
  );
  const netPositive = netCashFlow >= 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <ChartLegend />
        <div className="flex items-center rounded-lg border border-subtle bg-sunken p-0.5">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-caption font-semibold transition-all',
                range === value
                  ? 'bg-surface text-ink-900 shadow-card'
                  : 'text-ink-400 hover:text-ink-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={sliced} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-600)" stopOpacity={0.2} />
              <stop offset="80%" stopColor="var(--accent-600)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--danger-600)" stopOpacity={0.1} />
              <stop offset="80%" stopColor="var(--danger-600)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border-subtle)"
            strokeDasharray="3 4"
            vertical={false}
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--ink-400)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fill: 'var(--ink-400)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v / 1000}k`}
            width={38}
          />
          <Tooltip
            content={<ChartTooltip prefix="$" />}
            cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--accent-600)"
            strokeWidth={2}
            fill="url(#revFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: 'var(--accent-600)', strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="var(--danger-600)"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            fill="url(#expFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: 'var(--danger-600)', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 flex items-center justify-between border-t border-faint pt-3">
        <p className="text-caption font-semibold uppercase tracking-[0.06em] text-ink-400">
          Net cash flow
        </p>
        <p
          className={cn(
            'font-data text-heading font-semibold',
            netPositive ? 'text-accent-600' : 'text-danger-600',
          )}
        >
          {netPositive ? '+' : '-'}$
          {Math.abs(netCashFlow).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </div>
  );
}
