import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { SalaryStructureForm } from '@/components/domain/employees/SalaryStructureForm';
import { useEmployee, useEmployeeSlips } from '@/hooks/queries/useEmployees';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatPeriod } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';
import type { SalarySlip } from '@/types';

type Tab = 'profile' | 'salary' | 'slips';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');
  const { data: employee, isLoading } = useEmployee(id);
  const { data: slips } = useEmployeeSlips(id);

  if (isLoading || !employee) {
    return (
      <>
        <PageHeader title="Employee" breadcrumbs={[{ label: 'Employees', to: ROUTES.EMPLOYEES }]} />
        <Skeleton className="h-48 rounded-xl" />
      </>
    );
  }

  const slipColumns: Column<SalarySlip>[] = [
    { key: 'period', header: 'Period', isMono: true, render: (r) => formatPeriod(r.period) },
    {
      key: 'grossSalary',
      header: 'Gross',
      align: 'right',
      isMono: true,
      render: (r) => formatCurrency(r.grossSalary),
    },
    {
      key: 'netSalary',
      header: 'Net',
      align: 'right',
      isMono: true,
      render: (r) => formatCurrency(r.netSalary),
    },
    { key: 'paymentStatus', header: 'Status', render: (r) => <StatusPill kind="slip" status={r.paymentStatus} /> },
  ];

  return (
    <>
      <PageHeader
        title={employee.name}
        breadcrumbs={[{ label: 'Employees', to: ROUTES.EMPLOYEES }, { label: employee.name }]}
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employee.name} src={employee.avatarUrl} size="lg" />
            <div>
              <p className="text-heading text-ink-900">{employee.name}</p>
              <p className="text-body-sm text-ink-600">
                {employee.designation} · {employee.departmentName}
              </p>
              <p className="mt-1 font-data text-caption text-ink-400">{employee.employeeCode}</p>
            </div>
          </div>
          <StatusPill kind="employee" status={employee.status} size="md" />
        </div>
      </Card>

      <Tabs
        className="mb-5"
        tabs={[
          { label: 'Profile', value: 'profile' },
          { label: 'Salary structure', value: 'salary' },
          { label: 'Salary slips', value: 'slips', count: slips?.length },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      {tab === 'profile' && (
        <Card>
          <CardHeader title="Profile details" ruled />
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Email" icon={<Mail size={15} strokeWidth={1.5} />} value={employee.email} />
            <Field
              label="Phone"
              icon={<Phone size={15} strokeWidth={1.5} />}
              value={employee.phone ?? '—'}
              mono
            />
            <Field label="Department" value={employee.departmentName ?? '—'} />
            <Field label="Designation" value={employee.designation} />
            <Field
              label="Employment type"
              value={employee.employmentType.replace('_', ' ')}
            />
            <Field label="Joined" value={formatDate(employee.joinDate)} mono />
          </dl>
        </Card>
      )}

      {tab === 'salary' && (
        <Card>
          <CardHeader title="Salary structure" ruled />
          {employee.salaryStructure ? (
            <SalaryStructureForm structure={employee.salaryStructure} />
          ) : (
            <p className="text-body-sm text-ink-400">No salary structure assigned.</p>
          )}
        </Card>
      )}

      {tab === 'slips' && (
        <DataTable
          columns={slipColumns}
          data={slips ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(ROUTES.SALARY_SLIP_DETAIL(r.id))}
        />
      )}
    </>
  );
}

function Field({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-[0.02em] text-ink-400">{label}</dt>
      <dd className={`mt-1 flex items-center gap-2 capitalize text-ink-900 ${mono ? 'font-data' : ''}`}>
        {icon && <span className="text-ink-400">{icon}</span>}
        {value}
      </dd>
    </div>
  );
}
