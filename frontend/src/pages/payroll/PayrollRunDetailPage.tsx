import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ReceiptText, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { PayrollSummaryCard } from '@/components/domain/payroll/PayrollSummaryCard';
import {
  useDeletePayroll,
  useFinalizePayroll,
  usePayrollRun,
  usePayrollSlips,
} from '@/hooks/queries/usePayroll';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatPeriod } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';
import type { SalarySlip } from '@/types';

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: run, isLoading } = usePayrollRun(id);
  const { data: slips } = usePayrollSlips(id);
  const finalize = useFinalizePayroll();
  const remove = useDeletePayroll();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading || !run) {
    return (
      <>
        <PageHeader title="Payroll run" breadcrumbs={[{ label: 'Payroll', to: ROUTES.PAYROLL_RUNS }]} />
        <Skeleton className="h-48 rounded-xl" />
      </>
    );
  }

  const canFinalize = run.status === 'draft';
  const canDelete = run.status !== 'completed';

  async function handleFinalize() {
    if (!run) return;
    try {
      await finalize.mutateAsync(run.id);
      toast.success('Payroll finalized');
    } catch {
      toast.error('Could not finalize payroll');
    }
  }

  async function handleDelete() {
    if (!run) return;
    try {
      await remove.mutateAsync(run.id);
      toast.success('Payroll run deleted');
      navigate(ROUTES.PAYROLL_RUNS);
    } catch {
      toast.error('Could not delete payroll run');
    }
  }

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
    {
      key: 'grossSalary',
      header: 'Gross',
      align: 'right',
      isMono: true,
      render: (row) => formatCurrency(row.grossSalary),
    },
    {
      key: 'totalDeductions',
      header: 'Deductions',
      align: 'right',
      isMono: true,
      render: (row) => formatCurrency(row.totalDeductions),
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
        title={`Payroll · ${formatPeriod(run.period)}`}
        description={run.processedAt ? `Processed ${formatDate(run.processedAt)}` : 'Not finalized yet'}
        breadcrumbs={[{ label: 'Payroll', to: ROUTES.PAYROLL_RUNS }, { label: formatPeriod(run.period) }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill kind="payroll" status={run.status} size="md" />
            {canDelete && (
              <Button
                variant="outline"
                leftIcon={<Trash2 size={16} />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            )}
            {canFinalize && (
              <Button
                leftIcon={<CheckCircle2 size={16} />}
                isLoading={finalize.isPending}
                onClick={handleFinalize}
              >
                Finalize
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6">
        <PayrollSummaryCard
          totalGross={run.totalGross}
          totalDeductions={run.totalDeductions}
          totalNet={run.totalNet}
          employeeCount={run.totalEmployees}
        />
      </div>

      <Card>
        <CardHeader title="Salary slips" description={`${slips?.length ?? 0} generated`} ruled />
        <DataTable
          columns={columns}
          data={slips ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(ROUTES.SALARY_SLIP_DETAIL(r.id))}
          emptyState={
            <EmptyState
              icon={ReceiptText}
              title="No salary slips"
              description="This payroll run has no generated salary slips."
            />
          }
        />
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete payroll run?"
        description="This removes the run and all its generated salary slips. This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" isLoading={remove.isPending} onClick={handleDelete}>
              Delete run
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink-600">
          You are about to delete the payroll run for{' '}
          <span className="font-medium text-ink-900">{formatPeriod(run.period)}</span>.
        </p>
      </Modal>
    </>
  );
}
