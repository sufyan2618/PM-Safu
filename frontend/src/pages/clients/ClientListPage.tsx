import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, type Column } from '@/components/ui/Table';
import { useClients, useCreateClient } from '@/hooks/queries/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import { clientSchema, type ClientFormValues } from '@/constants/validation.constants';
import { ROUTES } from '@/constants/routes.constants';
import type { Client } from '@/types';

export function ClientListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useClients({ page, pageSize: 8, search: debouncedSearch });
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientSchema) });

  async function onSubmit(values: ClientFormValues) {
    await createClient.mutateAsync(values);
    toast.success('Client added');
    reset();
    setDrawerOpen(false);
  }

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Client',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.name}</p>
            <p className="truncate text-caption text-ink-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'companyName', header: 'Company', render: (row) => row.companyName ?? '—' },
    {
      key: 'totalInvoiced',
      header: 'Invoiced',
      align: 'right',
      isMono: true,
      sortable: true,
      render: (row) => formatCurrency(row.totalInvoiced),
    },
    {
      key: 'outstandingBalance',
      header: 'Outstanding',
      align: 'right',
      isMono: true,
      render: (row) => (
        <span className={row.outstandingBalance > 0 ? 'text-danger-600' : 'text-ink-400'}>
          {formatCurrency(row.outstandingBalance)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone you bill, with totals and outstanding balances."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add client
          </Button>
        }
      />

      <div className="mb-4 sm:w-72">
        <Input
          placeholder="Search clients…"
          leftIcon={<Search size={16} strokeWidth={1.5} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(ROUTES.CLIENT_DETAIL(row.id))}
        sortBy="totalInvoiced"
        pagination={{ page, pageSize: 8, total: data?.total ?? 0, onPageChange: setPage }}
        emptyState={
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to start invoicing them."
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
                Add client
              </Button>
            }
          />
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add client"
        description="Create a new client record."
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button form="client-form" type="submit" isLoading={isSubmitting}>
              Save client
            </Button>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" errorText={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" errorText={errors.email?.message} {...register('email')} />
          <Input label="Company" {...register('companyName')} />
          <Input label="Phone" {...register('phone')} />
          <Textarea label="Address" rows={2} {...register('address')} />
          <Input label="Tax ID" {...register('taxId')} />
          <Textarea label="Notes" rows={2} {...register('notes')} />
        </form>
      </Drawer>
    </>
  );
}
