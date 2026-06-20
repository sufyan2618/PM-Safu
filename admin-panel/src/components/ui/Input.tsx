import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, errorText, leftIcon, className, id, disabled, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = errorText
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-helper`
      : undefined;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-caption font-medium uppercase tracking-[0.02em] text-ink-600"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex h-10 items-center gap-2 rounded-lg border bg-surface px-3 text-body transition-colors',
          'focus-within:border-accent-600 focus-within:ring-1 focus-within:ring-accent-600',
          errorText ? 'border-danger-600' : 'border-strong',
          disabled && 'cursor-not-allowed bg-sunken opacity-60',
        )}
      >
        {leftIcon && <span className="shrink-0 text-ink-400">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!errorText}
          aria-describedby={describedBy}
          className="w-full bg-transparent text-ink-900 placeholder:text-ink-400 focus:outline-none"
          {...props}
        />
      </div>
      {errorText ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-caption text-danger-600">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="mt-1.5 text-caption text-ink-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
