import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { FilterChips } from '@/components/domain/shared/FilterChips';
import { ExportButton } from '@/components/domain/shared/ExportButton';
import { useSalarySlips } from '@/hooks/queries/useSalarySlips';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatPeriod } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';
import type { SalarySlip, SalarySlipPaymentStatus } from '@/types';

const STATUS_CHIPS: { label: string; value: SalarySlipPaymentStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
];

export function SalarySlipListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SalarySlipPaymentStatus | undefined>();
  const { data, isLoading } = useSalarySlips({ page, pageSize: 8, paymentStatus: status });

  const columns: Column<SalarySlip>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.employee?.name ?? '?'} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.employee?.name}</p>
            <p className="truncate font-data text-caption text-ink-400">
              {row.employee?.employeeCode}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'period', header: 'Period', isMono: true, render: (row) => formatPeriod(row.period) },
    {
      key: 'grossSalary',
      header: 'Gross',
      align: 'right',
      isMono: true,
      render: (row) => formatCurrency(row.grossSalary),
    },
    {
      key: 'netSalary',
      header: 'Net',
      align: 'right',
      isMono: true,
      render: (row) => formatCurrency(row.netSalary),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (row) => <StatusPill kind="slip" status={row.paymentStatus} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Salary slips"
        description="Every generated payslip, filterable by status and period."
        actions={
          <ExportButton
            data={data?.items ?? []}
            filename="salary-slips"
            columns={[
              { header: 'Employee', accessor: (r) => r.employee?.name ?? '' },
              { header: 'Period', accessor: (r) => r.period },
              { header: 'Gross', accessor: (r) => r.grossSalary },
              { header: 'Net', accessor: (r) => r.netSalary },
              { header: 'Status', accessor: (r) => r.paymentStatus },
            ]}
          />
        }
      />

      <div className="mb-4">
        <FilterChips
          chips={STATUS_CHIPS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(ROUTES.SALARY_SLIP_DETAIL(row.id))}
        pagination={{ page, pageSize: 8, total: data?.total ?? 0, onPageChange: setPage }}
        emptyState={
          <EmptyState
            icon={ReceiptText}
            title="No salary slips"
            description="Process a payroll run to generate salary slips."
          />
        }
      />
    </>
  );
}
