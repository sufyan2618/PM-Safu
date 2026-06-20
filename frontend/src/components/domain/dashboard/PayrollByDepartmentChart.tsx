import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import type { PayrollByDepartment } from '@/types';

const PALETTE = [
  'var(--accent-600)',
  'var(--info-600)',
  'var(--warn-600)',
  'var(--success-600)',
  'var(--danger-600)',
  'var(--ink-400)',
];

export function PayrollByDepartmentChart({ data }: { data: PayrollByDepartment[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="net"
          nameKey="departmentName"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
          stroke="var(--bg-surface)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.departmentId ?? entry.departmentName}
              fill={PALETTE[index % PALETTE.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip prefix="$" />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: 'var(--ink-600)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
