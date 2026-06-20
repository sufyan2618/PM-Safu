import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Pencil, Phone, UserX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { SalaryStructureForm } from '@/components/domain/employees/SalaryStructureForm';
import {
  useDeleteEmployee,
  useDepartments,
  useEmployee,
  useEmployeeSlips,
  useUpdateEmployee,
} from '@/hooks/queries/useEmployees';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatPeriod } from '@/utils/formatDate';
import {
  employeeEditSchema,
  type EmployeeEditFormValues,
} from '@/constants/validation.constants';
import { ROUTES } from '@/constants/routes.constants';
import type { SalarySlip } from '@/types';

type Tab = 'profile' | 'salary' | 'slips';

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('profile');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const { data: employee, isLoading } = useEmployee(id);
  const { data: slips } = useEmployeeSlips(id);
  const departments = useDepartments();
  const updateEmployee = useUpdateEmployee(id ?? '');
  const deleteEmployee = useDeleteEmployee();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditSchema),
  });
  const departmentId = useWatch({ control, name: 'departmentId' });
  const employmentType = useWatch({ control, name: 'employmentType' });

  useEffect(() => {
    if (employee && editOpen) {
      reset({
        name: employee.name,
        email: employee.email,
        phone: employee.phone ?? '',
        employeeCode: employee.employeeCode,
        departmentId: employee.departmentId,
        designation: employee.designation,
        employmentType: employee.employmentType,
        joinDate: employee.joinDate.slice(0, 10),
      });
    }
  }, [employee, editOpen, reset]);

  if (isLoading || !employee) {
    return (
      <>
        <PageHeader title="Employee" breadcrumbs={[{ label: 'Employees', to: ROUTES.EMPLOYEES }]} />
        <Skeleton className="h-48 rounded-xl" />
      </>
    );
  }

  async function onSubmit(values: EmployeeEditFormValues) {
    try {
      await updateEmployee.mutateAsync(values);
      toast.success('Employee updated');
      setEditOpen(false);
    } catch {
      toast.error('Could not update employee');
    }
  }

  async function handleTerminate() {
    if (!employee) return;
    try {
      await deleteEmployee.mutateAsync(employee.id);
      toast.success('Employee terminated');
      setConfirmTerminate(false);
    } catch {
      toast.error('Could not terminate employee');
    }
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
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Pencil size={16} />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {employee.status !== 'terminated' && (
              <Button
                variant="outline"
                leftIcon={<UserX size={16} />}
                onClick={() => setConfirmTerminate(true)}
              >
                Terminate
              </Button>
            )}
          </div>
        }
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
            <SalaryStructureForm structure={employee.salaryStructure} employeeId={employee.id} />
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

      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit employee"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button form="employee-edit-form" type="submit" isLoading={isSubmitting}>
              Save changes
            </Button>
          </>
        }
      >
        <form id="employee-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" errorText={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" errorText={errors.email?.message} {...register('email')} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee code"
              errorText={errors.employeeCode?.message}
              {...register('employeeCode')}
            />
            <Input label="Phone" {...register('phone')} />
          </div>
          <Select
            label="Department"
            value={departmentId}
            onChange={(v) => setValue('departmentId', v as string, { shouldValidate: true })}
            options={(departments.data ?? []).map((d) => ({ label: d.name, value: d.id }))}
            errorText={errors.departmentId?.message}
          />
          <Input
            label="Designation"
            errorText={errors.designation?.message}
            {...register('designation')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Employment type"
              value={employmentType}
              onChange={(v) =>
                setValue('employmentType', v as EmployeeEditFormValues['employmentType'])
              }
              options={[
                { label: 'Full-time', value: 'full_time' },
                { label: 'Part-time', value: 'part_time' },
                { label: 'Contract', value: 'contract' },
              ]}
            />
            <DatePicker
              label="Join date"
              errorText={errors.joinDate?.message}
              {...register('joinDate')}
            />
          </div>
        </form>
      </Drawer>

      <Modal
        open={confirmTerminate}
        onClose={() => setConfirmTerminate(false)}
        title="Terminate employee?"
        description="The employee will be marked as terminated and removed from future payroll runs."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmTerminate(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteEmployee.isPending}
              onClick={handleTerminate}
            >
              Terminate
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink-600">
          Are you sure you want to terminate{' '}
          <span className="font-medium text-ink-900">{employee.name}</span>?
        </p>
      </Modal>
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
