import { cn } from '@/utils/cn';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  /** Render as the accent hairline ledger rule. */
  ledger?: boolean;
  className?: string;
}

export function Divider({ orientation = 'horizontal', ledger = false, className }: DividerProps) {
  if (orientation === 'vertical') {
    return <span className={cn('inline-block w-px self-stretch bg-subtle', className)} />;
  }
  return (
    <hr
      className={cn(
        'border-0 border-t',
        ledger ? 'border-accent-600/20' : 'border-subtle',
        className,
      )}
    />
  );
}
