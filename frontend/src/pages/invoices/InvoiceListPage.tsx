import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { FilterChips } from '@/components/domain/shared/FilterChips';
import { ExportButton } from '@/components/domain/shared/ExportButton';
import { useInvoices } from '@/hooks/queries/useInvoices';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';
import type { Invoice, InvoiceStatus } from '@/types';

const STATUS_CHIPS: { label: string; value: InvoiceStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
];

export function InvoiceListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | undefined>();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useInvoices({
    page,
    pageSize: 8,
    status,
    search: debouncedSearch,
  });

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      isMono: true,
      render: (row) => <span className="font-medium text-ink-900">{row.invoiceNumber}</span>,
    },
    { key: 'client', header: 'Client', render: (row) => row.client?.name ?? '—' },
    { key: 'issueDate', header: 'Issued', isMono: true, render: (row) => formatDate(row.issueDate) },
    { key: 'dueDate', header: 'Due', isMono: true, render: (row) => formatDate(row.dueDate) },
    { key: 'status', header: 'Status', render: (row) => <StatusPill kind="invoice" status={row.status} /> },
    {
      key: 'total',
      header: 'Amount',
      align: 'right',
      isMono: true,
      sortable: true,
      render: (row) => formatCurrency(row.total),
    },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create, send and track every invoice in one place."
        actions={
          <>
            <ExportButton
              data={data?.items ?? []}
              filename="invoices"
              columns={[
                { header: 'Invoice', accessor: (r) => r.invoiceNumber },
                { header: 'Client', accessor: (r) => r.client?.name ?? '' },
                { header: 'Status', accessor: (r) => r.status },
                { header: 'Total', accessor: (r) => r.total },
              ]}
            />
            <Button leftIcon={<Plus size={16} />} onClick={() => navigate(ROUTES.INVOICE_CREATE)}>
              New invoice
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          chips={STATUS_CHIPS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <div className="sm:w-72">
          <Input
            placeholder="Search by invoice number…"
            leftIcon={<Search size={16} strokeWidth={1.5} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(ROUTES.INVOICE_DETAIL(row.id))}
        sortBy="total"
        pagination={{
          page,
          pageSize: 8,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
        emptyState={
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create your first invoice to start billing clients."
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => navigate(ROUTES.INVOICE_CREATE)}>
                Create invoice
              </Button>
            }
          />
        }
      />
    </>
  );
}
