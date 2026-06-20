import { cn } from '@/utils/cn';

export interface FilterChip<T extends string> {
  label: string;
  value: T;
  count?: number;
}

interface FilterChipsProps<T extends string> {
  chips: FilterChip<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}

export function FilterChips<T extends string>({ chips, value, onChange }: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={cn(
          'rounded-full border px-3 py-1 text-body-sm font-medium transition-colors',
          value === undefined
            ? 'border-accent-600 bg-accent-100 text-accent-600'
            : 'border-subtle text-ink-600 hover:bg-sunken',
        )}
      >
        All
      </button>
      {chips.map((chip) => {
        const active = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-body-sm font-medium transition-colors',
              active
                ? 'border-accent-600 bg-accent-100 text-accent-600'
                : 'border-subtle text-ink-600 hover:bg-sunken',
            )}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className="font-data text-caption text-ink-400">{chip.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
