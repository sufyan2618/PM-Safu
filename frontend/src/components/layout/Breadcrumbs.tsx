import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-400">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to} className="transition-colors hover:text-ink-600">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-ink-600' : undefined}>{item.label}</span>
              )}
              {!isLast && <ChevronRight size={13} strokeWidth={1.5} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
