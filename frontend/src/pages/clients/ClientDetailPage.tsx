import { useNavigate, useParams } from 'react-router-dom';
import { Mail, MapPin, Phone, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { useClient, useClientInvoices } from '@/hooks/queries/useClients';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';
import type { Invoice } from '@/types';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: invoices } = useClientInvoices(id);

  if (isLoading || !client) {
    return (
      <>
        <PageHeader title="Client" breadcrumbs={[{ label: 'Clients', to: ROUTES.CLIENTS }]} />
        <Skeleton className="h-48 rounded-xl" />
      </>
    );
  }

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice', isMono: true },
    { key: 'issueDate', header: 'Issued', isMono: true, render: (r) => formatDate(r.issueDate) },
    { key: 'status', header: 'Status', render: (r) => <StatusPill kind="invoice" status={r.status} /> },
    {
      key: 'total',
      header: 'Amount',
      align: 'right',
      isMono: true,
      render: (r) => formatCurrency(r.total),
    },
  ];

  return (
    <>
      <PageHeader
        title={client.name}
        breadcrumbs={[{ label: 'Clients', to: ROUTES.CLIENTS }, { label: client.name }]}
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate(ROUTES.INVOICE_CREATE)}>
            New invoice
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar name={client.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-heading text-ink-900">{client.name}</p>
              <p className="truncate text-body-sm text-ink-400">{client.companyName}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-body-sm">
            <div className="flex items-center gap-2.5 text-ink-600">
              <Mail size={15} strokeWidth={1.5} className="text-ink-400" />
              {client.email}
            </div>
            {client.phone && (
              <div className="flex items-center gap-2.5 text-ink-600">
                <Phone size={15} strokeWidth={1.5} className="text-ink-400" />
                <span className="font-data">{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2.5 text-ink-600">
                <MapPin size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-400" />
                {client.address}
              </div>
            )}
          </div>
          <div className="ledger-rule my-5" />
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-caption uppercase tracking-[0.02em] text-ink-400">Invoiced</dt>
              <dd className="mt-1 font-data text-heading text-ink-900">
                {formatCurrency(client.totalInvoiced)}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-[0.02em] text-ink-400">Outstanding</dt>
              <dd className="mt-1 font-data text-heading text-danger-600">
                {formatCurrency(client.outstandingBalance)}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="lg:col-span-2">
          <Card padded={false}>
            <div className="p-5">
              <CardHeader title="Invoice history" ruled />
            </div>
            <div className="px-5 pb-5">
              <DataTable
                columns={columns}
                data={invoices ?? []}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(ROUTES.INVOICE_DETAIL(r.id))}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
