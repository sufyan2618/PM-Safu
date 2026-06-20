import { useMemo, useState } from 'react';
import { RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type Column } from '@/components/ui/Table';
import { useAuditActions, useAuditLogs } from '@/hooks/queries/useAuditLogs';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime, formatRelative } from '@/utils/formatDate';
import { ROLE_LABELS } from '@/constants/roles.constants';
import type { AuditLog, Role } from '@/types';

const PAGE_SIZE = 20;

const METHOD_TONE: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  POST: 'success',
  PATCH: 'warning',
  PUT: 'warning',
  DELETE: 'danger',
  GET: 'info',
};

/** "invoice.send" -> "Invoice · Send"; "auth.login" -> "Auth · Login". */
function formatAction(action: string): string {
  return action
    .split('.')
    .map((part) =>
      part
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join(' · ');
}

function roleLabel(role?: string): string {
  if (!role) return '—';
  return ROLE_LABELS[role as Role] ?? role;
}

export function AuditLogPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 350);
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
      ...(search ? { search } : {}),
      ...(action ? { action } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo: `${dateTo}T23:59:59.999Z` } : {}),
    }),
    [page, search, action, status, dateFrom, dateTo],
  );

  const { data, isLoading, isFetching } = useAuditLogs(params);
  const { data: actions } = useAuditActions();

  const hasFilters = Boolean(search || action || status || dateFrom || dateTo);

  function resetFilters() {
    setSearchInput('');
    setAction('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  function withReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const actionOptions = useMemo(
    () => [
      { label: 'All actions', value: '' },
      ...(actions ?? []).map((a) => ({ label: formatAction(a), value: a })),
    ],
    [actions],
  );

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Time',
      width: '180px',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-data text-body-sm text-ink-900">{formatDateTime(row.createdAt)}</p>
          <p className="text-caption text-ink-400">{formatRelative(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'actorName',
      header: 'Actor',
      render: (row) => {
        const display = row.actorName ?? row.actorEmail ?? 'Unknown';
        return (
          <div className="flex items-center gap-3">
            <Avatar name={display} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-900">{display}</p>
              <p className="truncate text-caption text-ink-400">
                {row.actorEmail ? `${row.actorEmail} · ` : ''}
                {roleLabel(row.actorRole)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.method && (
            <Badge tone={METHOD_TONE[row.method] ?? 'neutral'} size="sm">
              {row.method}
            </Badge>
          )}
          <span className="font-medium text-ink-900">{formatAction(row.action)}</span>
        </div>
      ),
    },
    {
      key: 'targetType',
      header: 'Target',
      render: (row) =>
        row.targetType ? (
          <div className="min-w-0">
            <p className="text-body-sm text-ink-900">{row.targetType}</p>
            {row.targetId && (
              <p className="truncate font-data text-caption text-ink-400">
                #{row.targetId.slice(-6)}
              </p>
            )}
          </div>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Badge tone={row.status === 'success' ? 'success' : 'danger'} dot>
          {row.status === 'success' ? 'Success' : 'Failed'}
          {row.statusCode ? ` · ${row.statusCode}` : ''}
        </Badge>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP address',
      isMono: true,
      render: (row) => row.ipAddress ?? '—',
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="A complete, tamper-evident record of every action taken in your company."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Input
            placeholder="Search actor, action, IP…"
            leftIcon={<Search size={16} strokeWidth={1.5} />}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          placeholder="All actions"
          searchable
          value={action}
          onChange={withReset((v) => setAction(v as string))}
          options={actionOptions}
        />
        <Select
          placeholder="All statuses"
          value={status}
          onChange={withReset((v) => setStatus(v as string))}
          options={[
            { label: 'All statuses', value: '' },
            { label: 'Success', value: 'success' },
            { label: 'Failed', value: 'failed' },
          ]}
        />
        <Input
          type="date"
          aria-label="From date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          aria-label="To date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {hasFilters && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-caption text-ink-400">
            {data?.total ?? 0} {data?.total === 1 ? 'entry' : 'entries'} match your filters
            {isFetching ? ' · updating…' : ''}
          </p>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={14} strokeWidth={1.5} />}
            onClick={resetFilters}
          >
            Clear filters
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        emptyState={
          <EmptyState
            icon={ShieldCheck}
            title={hasFilters ? 'No matching activity' : 'No activity yet'}
            description={
              hasFilters
                ? 'Try adjusting or clearing your filters.'
                : 'Actions taken across your company will appear here.'
            }
          />
        }
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />
    </>
  );
}
