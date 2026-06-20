import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { ServerExportButton } from '@/components/domain/shared/ServerExportButton';
import { exportService } from '@/api/services/export.service';
import { usePayrollRuns } from '@/hooks/queries/usePayroll';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatPeriod, formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';
import type { PayrollRun } from '@/types';

export function PayrollRunListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayrollRuns({ page, pageSize: 8 });

  const columns: Column<PayrollRun>[] = [
    {
      key: 'period',
      header: 'Period',
      render: (row) => <span className="font-medium text-ink-900">{formatPeriod(row.period)}</span>,
    },
    { key: 'totalEmployees', header: 'Employees', align: 'right', isMono: true },
    {
      key: 'totalGross',
      header: 'Gross',
      align: 'right',
      isMono: true,
      render: (row) => formatCurrency(row.totalGross),
    },
    {
      key: 'totalNet',
      header: 'Net payout',
      align: 'right',
      isMono: true,
      render: (row) => formatCurrency(row.totalNet),
    },
    {
      key: 'processedAt',
      header: 'Processed',
      isMono: true,
      render: (row) => (row.processedAt ? formatDate(row.processedAt) : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill kind="payroll" status={row.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Payroll runs"
        description="History of every pay period you've processed."
        actions={
          <>
            <ServerExportButton onExport={() => exportService.payroll()} />
            <Button leftIcon={<Play size={16} />} onClick={() => navigate(ROUTES.PAYROLL_NEW)}>
              Run payroll
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(ROUTES.PAYROLL_DETAIL(row.id))}
        pagination={{ page, pageSize: 8, total: data?.total ?? 0, onPageChange: setPage }}
        emptyState={
          <EmptyState
            icon={Wallet}
            title="No payroll runs yet"
            description="Process your first payroll run to generate salary slips."
            action={
              <Button leftIcon={<Play size={16} />} onClick={() => navigate(ROUTES.PAYROLL_NEW)}>
                Run payroll
              </Button>
            }
          />
        }
      />
    </>
  );
}
