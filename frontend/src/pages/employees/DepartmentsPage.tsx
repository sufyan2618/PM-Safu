import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { useCreateDepartment, useDepartments } from '@/hooks/queries/useEmployees';
import { useToast } from '@/hooks/useToast';
import { departmentSchema, type DepartmentFormValues } from '@/constants/validation.constants';
import { ROUTES } from '@/constants/routes.constants';

export function DepartmentsPage() {
  const toast = useToast();
  const { data, isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({ resolver: zodResolver(departmentSchema) });

  async function onSubmit(values: DepartmentFormValues) {
    await createDepartment.mutateAsync(values);
    toast.success('Department created');
    reset();
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Departments"
        breadcrumbs={[{ label: 'Employees', to: ROUTES.EMPLOYEES }, { label: 'Departments' }]}
        description="Organize your people into teams."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>
            New department
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((dept) => (
            <Card key={dept.id} hoverable className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                  <Building2 size={20} strokeWidth={1.5} />
                </span>
                <span className="inline-flex items-center gap-1.5 font-data text-body-sm text-ink-600">
                  <Users size={14} strokeWidth={1.5} className="text-ink-400" />
                  {dept.employeeCount}
                </span>
              </div>
              <h3 className="mt-4 text-heading text-ink-900">{dept.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-body-sm text-ink-600">
                {dept.description}
              </p>
              {dept.headEmployeeName && (
                <div className="ledger-rule mt-4 flex items-center gap-2 pt-3">
                  <Avatar name={dept.headEmployeeName} size="xs" />
                  <span className="text-caption text-ink-400">Head: {dept.headEmployeeName}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New department"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="dept-form" type="submit" isLoading={isSubmitting}>
              Create
            </Button>
          </>
        }
      >
        <form id="dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" errorText={errors.name?.message} {...register('name')} />
          <Textarea label="Description" rows={3} {...register('description')} />
        </form>
      </Modal>
    </>
  );
}
