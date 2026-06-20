import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-600 text-white hover:bg-accent-500 disabled:bg-accent-600/50 disabled:text-white/80',
  secondary: 'bg-sunken text-ink-900 hover:bg-strong/60',
  outline: 'border border-strong text-ink-900 bg-transparent hover:bg-sunken',
  ghost: 'text-ink-900 bg-transparent hover:bg-sunken',
  destructive: 'border border-danger-600 text-danger-600 bg-transparent hover:bg-danger-100',
  link: 'text-accent-600 hover:text-accent-500 underline-offset-4 hover:underline px-0',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-body-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-body gap-2 rounded-lg',
  lg: 'h-12 px-6 text-body gap-2 rounded-lg',
  icon: 'h-10 w-10 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {size !== 'icon' && children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});
