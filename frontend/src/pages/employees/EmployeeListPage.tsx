import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IdCard, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Drawer } from '@/components/ui/Drawer';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type Column } from '@/components/ui/Table';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { FilterChips } from '@/components/domain/shared/FilterChips';
import {
  useCreateEmployee,
  useDepartments,
  useEmployees,
} from '@/hooks/queries/useEmployees';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/formatDate';
import { employeeSchema, type EmployeeFormValues } from '@/constants/validation.constants';
import { ROUTES } from '@/constants/routes.constants';
import type { Employee, EmployeeStatus } from '@/types';

const STATUS_CHIPS: { label: string; value: EmployeeStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Terminated', value: 'terminated' },
];

export function EmployeeListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<EmployeeStatus | undefined>();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const departments = useDepartments();
  const { data, isLoading } = useEmployees({
    page,
    pageSize: 8,
    status,
    search: debouncedSearch,
  });
  const createEmployee = useCreateEmployee();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { employmentType: 'full_time' },
  });
  const departmentId = useWatch({ control, name: 'departmentId' });
  const employmentType = useWatch({ control, name: 'employmentType' });

  async function onSubmit(values: EmployeeFormValues) {
    await createEmployee.mutateAsync(values);
    toast.success('Employee added');
    reset();
    setDrawerOpen(false);
  }

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.name}</p>
            <p className="truncate font-data text-caption text-ink-400">{row.employeeCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'designation', header: 'Designation' },
    { key: 'departmentName', header: 'Department', render: (row) => row.departmentName ?? '—' },
    { key: 'joinDate', header: 'Joined', isMono: true, render: (row) => formatDate(row.joinDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill kind="employee" status={row.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        description="Your people, their roles and employment status."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add employee
          </Button>
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
            placeholder="Search employees…"
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
        onRowClick={(row) => navigate(ROUTES.EMPLOYEE_DETAIL(row.id))}
        pagination={{ page, pageSize: 8, total: data?.total ?? 0, onPageChange: setPage }}
        emptyState={
          <EmptyState
            icon={IdCard}
            title="No employees yet"
            description="Add employees to run payroll and issue salary slips."
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
                Add employee
              </Button>
            }
          />
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add employee"
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button form="employee-form" type="submit" isLoading={isSubmitting}>
              Save employee
            </Button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              onChange={(v) => setValue('employmentType', v as EmployeeFormValues['employmentType'])}
              options={[
                { label: 'Full-time', value: 'full_time' },
                { label: 'Part-time', value: 'part_time' },
                { label: 'Contract', value: 'contract' },
              ]}
            />
            <DatePicker label="Join date" errorText={errors.joinDate?.message} {...register('joinDate')} />
          </div>
        </form>
      </Drawer>
    </>
  );
}
