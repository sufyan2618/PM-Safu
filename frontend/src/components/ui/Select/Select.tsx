import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T | T[] | undefined;
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  label?: string;
  errorText?: string;
  disabled?: boolean;
  className?: string;
}

interface MenuPosition {
  left: number;
  width: number;
  /** Distance from the top of the viewport when opening downward. */
  top: number;
  /** Distance from the bottom of the viewport when opening upward. */
  bottom: number;
  openUp: boolean;
  maxHeight: number;
}

const GAP = 4;
const DESIRED_MENU_HEIGHT = 280;

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  multiple = false,
  searchable = false,
  placeholder = 'Select…',
  label,
  errorText,
  disabled = false,
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();

  const selectedValues = useMemo<T[]>(
    () => (Array.isArray(value) ? value : value !== undefined ? [value] : []),
    [value],
  );

  const filtered = useMemo(() => {
    if (!searchable || !query) return options;
    return options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  }, [options, query, searchable]);

  const displayLabel = useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (multiple) return `${selectedValues.length} selected`;
    return options.find((o) => o.value === selectedValues[0])?.label ?? placeholder;
  }, [selectedValues, options, multiple, placeholder]);

  // Position the floating menu relative to the trigger, flipping above when
  // there isn't enough room below (e.g. inside a short modal).
  useLayoutEffect(() => {
    if (!open) return;

    function reposition() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < DESIRED_MENU_HEIGHT && spaceAbove > spaceBelow;
      const available = (openUp ? spaceAbove : spaceBelow) - GAP - 8;
      setMenu({
        left: rect.left,
        width: rect.width,
        top: rect.bottom,
        bottom: window.innerHeight - rect.top,
        openUp,
        maxHeight: Math.max(120, Math.min(DESIRED_MENU_HEIGHT, available)),
      });
    }

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  // Close on outside interaction, accounting for the portalled menu.
  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  function handleSelect(optionValue: T) {
    if (multiple) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(next);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  }

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-caption font-medium uppercase tracking-[0.02em] text-ink-600"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          id={fieldId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-body transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600',
            errorText ? 'border-danger-600' : 'border-strong hover:border-accent-600',
            disabled && 'cursor-not-allowed bg-sunken opacity-60',
          )}
        >
          <span className={cn('truncate', selectedValues.length === 0 && 'text-ink-400')}>
            {displayLabel}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={cn('shrink-0 text-ink-400 transition-transform', open && 'rotate-180')}
          />
        </button>

        {open &&
          menu &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                left: menu.left,
                width: menu.width,
                ...(menu.openUp
                  ? { bottom: menu.bottom + GAP }
                  : { top: menu.top + GAP }),
              }}
              className="z-100 overflow-hidden rounded-lg border border-subtle bg-surface shadow-popover"
            >
              {searchable && (
                <div className="flex items-center gap-2 border-b border-subtle px-3 py-2">
                  <Search size={15} strokeWidth={1.5} className="text-ink-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-transparent text-body-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                  />
                </div>
              )}
              <ul
                role="listbox"
                className="overflow-auto py-1"
                style={{ maxHeight: menu.maxHeight }}
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-body-sm text-ink-400">No options found</li>
                ) : (
                  filtered.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <li key={String(option.value)}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={option.disabled}
                          onClick={() => handleSelect(option.value)}
                          className={cn(
                            'flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-body-sm transition-colors',
                            'hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50',
                            isSelected && 'bg-accent-100',
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-ink-900">{option.label}</span>
                            {option.description && (
                              <span className="block truncate text-caption text-ink-400">
                                {option.description}
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-accent-600" />
                          )}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )}
      </div>
      {errorText && <p className="mt-1.5 text-caption text-danger-600">{errorText}</p>}
    </div>
  );
}
