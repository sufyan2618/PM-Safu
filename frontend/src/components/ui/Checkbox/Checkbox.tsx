import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, indeterminate = false, className, id, checked, disabled, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <label
      htmlFor={fieldId}
      className={cn(
        'inline-flex items-start gap-2.5',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors',
            'border-strong bg-surface',
            'peer-checked:border-accent-600 peer-checked:bg-accent-600',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600',
            indeterminate && 'border-accent-600 bg-accent-600',
          )}
        >
          {indeterminate ? (
            <Minus size={13} strokeWidth={3} className="text-white" />
          ) : (
            <Check
              size={13}
              strokeWidth={3}
              className={cn('text-white', checked ? 'opacity-100' : 'opacity-0')}
            />
          )}
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-body-sm text-ink-900">{label}</span>}
          {description && <span className="block text-caption text-ink-400">{description}</span>}
        </span>
      )}
    </label>
  );
});
