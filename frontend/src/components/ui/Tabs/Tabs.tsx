import { cn } from '@/utils/cn';

export interface TabItem<T extends string = string> {
  label: string;
  value: T;
  count?: number;
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string = string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn('border-b border-subtle', className)} role="tablist">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                'relative whitespace-nowrap px-4 py-2.5 text-body-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600',
                active ? 'text-ink-900' : 'text-ink-400 hover:text-ink-600',
              )}
            >
              <span className="inline-flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 font-data text-[10px]',
                      active ? 'bg-accent-100 text-accent-600' : 'bg-sunken text-ink-400',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
