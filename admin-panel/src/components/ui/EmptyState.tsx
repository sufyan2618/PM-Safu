import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-ink-400">{icon}</div>}
      <div>
        <p className="text-body font-medium text-ink-900">{title}</p>
        {description && <p className="mt-1 text-body-sm text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
