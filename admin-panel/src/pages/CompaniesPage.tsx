import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill, ActivePill } from '@/components/ui/StatusPill';
import { useCompanies } from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CompanyStatus } from '@/types';

const STATUS_FILTERS: { value: CompanyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 20;

export function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as CompanyStatus | null;
  const status = statusParam ?? 'all';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      sort: '-createdAt',
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : status,
    }),
    [page, search, status],
  );

  const { data, isLoading, isFetching } = useCompanies(params);

  const setStatus = (value: CompanyStatus | 'all') => {
    setPage(1);
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const companies = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink-900">Companies</h1>
        <p className="mt-1 text-body-sm text-ink-600">
          Review registrations and manage tenant access.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-subtle bg-sunken p-0.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors',
                status === filter.value
                  ? 'bg-surface text-accent-600 shadow-card'
                  : 'text-ink-600 hover:text-ink-900',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="sm:w-64">
          <Input
            placeholder="Search companies…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            leftIcon={<Search size={16} strokeWidth={1.5} />}
          />
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={22} />
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            icon={<Building2 size={28} strokeWidth={1.5} />}
            title="No companies found"
            description="Try adjusting your search or status filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-subtle text-caption uppercase tracking-[0.02em] text-ink-400">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Access</th>
                  <th className="px-5 py-3 font-medium">Registered</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company._id}
                    className="border-b border-subtle last:border-0 transition-colors hover:bg-sunken/50"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-body-sm font-medium text-ink-900">{company.companyName}</p>
                      <p className="text-caption text-ink-400">{company.registrationEmail}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={company.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <ActivePill isActive={company.isActive} />
                    </td>
                    <td className="px-5 py-3.5 text-body-sm text-ink-600">
                      {formatDate(company.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/companies/${company._id}`}>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-caption text-ink-400">
            Page {data?.page ?? page} of {totalPages}
            {isFetching && <span className="ml-2">·&nbsp;updating…</span>}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft size={16} />}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
