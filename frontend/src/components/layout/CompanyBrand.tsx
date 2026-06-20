import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

interface CompanyBrandProps {
  collapsed?: boolean;
  className?: string;
}

function initials(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Tenant branding for the sidebar — shows the signed-in company's own logo & name. */
export function CompanyBrand({ collapsed = false, className }: CompanyBrandProps) {
  const company = useAuthStore((s) => s.company);
  const name = company?.companyName ?? 'Workspace';

  if (collapsed) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={name}
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-lg bg-accent-100 font-data text-caption font-semibold text-accent-600">
            {initials(name)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      {company?.logoUrl ? (
        <img
          src={company.logoUrl}
          alt={name}
          className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-subtle"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 select-none items-center justify-center rounded-2xl bg-accent-100 font-data text-display-sm font-semibold text-accent-600">
          {initials(name)}
        </span>
      )}
      <span className="line-clamp-2 max-w-full text-heading font-semibold leading-tight tracking-tight text-ink-900">
        {name}
      </span>
    </div>
  );
}
