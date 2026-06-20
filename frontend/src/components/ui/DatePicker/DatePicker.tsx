import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  errorText?: string;
}

/**
 * Styled date field backed by the native date input for reliability and
 * built-in accessibility, themed to match the rest of the form controls.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, errorText, className, id, disabled, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-caption font-medium uppercase tracking-[0.02em] text-ink-600"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex h-10 items-center gap-2 rounded-lg border bg-surface px-3 transition-colors',
          'focus-within:border-accent-600 focus-within:ring-1 focus-within:ring-accent-600',
          errorText ? 'border-danger-600' : 'border-strong',
          disabled && 'cursor-not-allowed bg-sunken opacity-60',
        )}
      >
        <Calendar size={16} strokeWidth={1.5} className="shrink-0 text-ink-400" />
        <input
          ref={ref}
          id={fieldId}
          type="date"
          disabled={disabled}
          aria-invalid={!!errorText}
          className={cn(
            'w-full bg-transparent font-data text-body text-ink-900 focus:outline-none',
            '[&::-webkit-calendar-picker-indicator]:opacity-60 dark:[&::-webkit-calendar-picker-indicator]:invert',
            className,
          )}
          {...props}
        />
      </div>
      {errorText && <p className="mt-1.5 text-caption text-danger-600">{errorText}</p>}
    </div>
  );
});
