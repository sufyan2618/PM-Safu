import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'end', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className={cn('relative inline-flex', className)} ref={ref}>
      <span
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        {trigger}
      </span>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-50 mt-1 min-w-44 overflow-hidden rounded-lg border border-subtle bg-surface py-1 shadow-popover',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                item.tone === 'danger'
                  ? 'text-danger-600 hover:bg-danger-100'
                  : 'text-ink-900 hover:bg-sunken',
              )}
            >
              {item.icon && <span className="shrink-0 text-ink-400">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
