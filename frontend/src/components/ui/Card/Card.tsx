import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hoverable?: boolean;
  as?: 'div' | 'section';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padded = true, hoverable = false, as = 'div', className, children, ...props },
  ref,
) {
  const Component = as;
  return (
    <Component
      ref={ref as never}
      className={cn(
        'rounded-xl border border-subtle bg-surface shadow-card',
        padded && 'p-5',
        hoverable && 'transition-colors hover:border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Render the signature hairline rule under the header. */
  ruled?: boolean;
}

export function CardHeader({
  title,
  description,
  action,
  ruled = false,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-heading text-ink-900">{title}</h3>
          {description && <p className="mt-0.5 text-body-sm text-ink-600">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {ruled && <span className="ledger-rule mt-3 block" />}
    </div>
  );
}
