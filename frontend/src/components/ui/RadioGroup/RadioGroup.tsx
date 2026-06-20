import { useId } from 'react';
import { cn } from '@/utils/cn';

export interface RadioOption<T extends string = string> {
  label: string;
  value: T;
  description?: string;
}

interface RadioGroupProps<T extends string = string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  name?: string;
  className?: string;
}

export function RadioGroup<T extends string = string>({
  options,
  value,
  onChange,
  label,
  name,
  className,
}: RadioGroupProps<T>) {
  const autoName = useId();
  const groupName = name ?? autoName;

  return (
    <div className={className} role="radiogroup" aria-label={label}>
      {label && (
        <p className="mb-1.5 text-caption font-medium uppercase tracking-[0.02em] text-ink-600">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                selected ? 'border-accent-600 bg-accent-100' : 'border-subtle hover:bg-sunken',
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-accent-600' : 'border-strong',
                )}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent-600" />}
              </span>
              <span className="min-w-0">
                <span className="block text-body-sm text-ink-900">{option.label}</span>
                {option.description && (
                  <span className="block text-caption text-ink-400">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
