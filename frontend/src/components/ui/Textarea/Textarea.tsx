import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helperText, errorText, className, id, rows = 4, disabled, ...props },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!errorText}
        className={cn(
          'w-full rounded-lg border bg-surface px-3 py-2 text-body text-ink-900 placeholder:text-ink-400',
          'transition-colors focus:outline-none focus:ring-1 focus:ring-accent-600',
          errorText ? 'border-danger-600' : 'border-strong focus:border-accent-600',
          disabled && 'cursor-not-allowed bg-sunken opacity-60',
          className,
        )}
        {...props}
      />
      {errorText ? (
        <p className="mt-1.5 text-caption text-danger-600">{errorText}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-caption text-ink-400">{helperText}</p>
      ) : null}
    </div>
  );
});
