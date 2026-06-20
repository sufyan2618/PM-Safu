import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-subtle bg-sunken">
        <Icon size={24} strokeWidth={1.5} className="text-ink-400" />
      </span>
      <h3 className="text-heading text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-body-sm text-ink-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
