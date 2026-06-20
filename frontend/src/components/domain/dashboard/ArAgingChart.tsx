import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import type { ArAgingBucket } from '@/types';

const BUCKET_COLORS: Record<string, string> = {
  current: 'var(--info-600)',
  '1-30': 'var(--accent-600)',
  '31-60': 'var(--warn-600)',
  '61-90': 'var(--warn-600)',
  '90+': 'var(--danger-600)',
};

export function ArAgingChart({ data }: { data: ArAgingBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="bucket"
          tick={{ fill: 'var(--ink-400)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--ink-400)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v / 1000}k`}
        />
        <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ fill: 'var(--bg-sunken)' }} />
        <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]} barSize={36}>
          {data.map((entry) => (
            <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket] ?? 'var(--accent-600)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
