import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import type { RevenueByClient } from '@/types';

export function RevenueByClientChart({ data }: { data: RevenueByClient[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 42)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: 'var(--ink-400)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v / 1000}k`}
        />
        <YAxis
          type="category"
          dataKey="clientName"
          width={120}
          tick={{ fill: 'var(--ink-600)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ fill: 'var(--bg-sunken)' }} />
        <Bar dataKey="revenue" name="Revenue" fill="var(--accent-600)" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
