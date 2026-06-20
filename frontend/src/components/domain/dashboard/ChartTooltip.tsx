interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  prefix?: string;
}

export function ChartTooltip({ active, payload, label, prefix = '' }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-subtle bg-surface px-3 py-2 shadow-popover">
      <p className="mb-1 text-caption font-medium text-ink-600">{label}</p>
      <div className="space-y-0.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-caption text-ink-400">{entry.name}</span>
            <span className="ml-auto font-data text-body-sm text-ink-900">
              {prefix}
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
