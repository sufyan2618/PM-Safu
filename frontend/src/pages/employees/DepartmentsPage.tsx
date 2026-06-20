import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useEmployees,
  useUpdateDepartment,
} from '@/hooks/queries/useEmployees';
import { useToast } from '@/hooks/useToast';
import { departmentSchema, type DepartmentFormValues } from '@/constants/validation.constants';
import { ROUTES } from '@/constants/routes.constants';
import type { Department } from '@/types';

const NO_HEAD = '';

export function DepartmentsPage() {
  const toast = useToast();
  const { data, isLoading } = useDepartments();
  const employees = useEmployees({ pageSize: 100 });
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [headId, setHeadId] = useState<string>(NO_HEAD);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({ resolver: zodResolver(departmentSchema) });

  function openCreate() {
    setEditing(null);
    setHeadId(NO_HEAD);
    reset({ name: '', description: '' });
    setFormOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setHeadId(dept.headEmployeeId ?? NO_HEAD);
    reset({ name: dept.name, description: dept.description ?? '' });
    setFormOpen(true);
  }

  async function onSubmit(values: DepartmentFormValues) {
    try {
      if (editing) {
        await updateDepartment.mutateAsync({
          id: editing.id,
          patch: { ...values, headOfDepartment: headId || null },
        });
        toast.success('Department updated');
      } else {
        await createDepartment.mutateAsync(values);
        toast.success('Department created');
      }
      reset();
      setFormOpen(false);
    } catch {
      toast.error('Could not save department');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteDepartment.mutateAsync(deleting.id);
      toast.success('Department deleted');
      setDeleting(null);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error('Could not delete department', message ?? 'Please try again.');
    }
  }

  const employeeOptions = [
    { label: 'No head assigned', value: NO_HEAD },
    ...(employees.data?.items ?? []).map((e) => ({ label: e.name, value: e.id })),
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        breadcrumbs={[{ label: 'Employees', to: ROUTES.EMPLOYEES }, { label: 'Departments' }]}
        description="Organize your people into teams."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
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
            <Card key={dept.id} className="group flex flex-col">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                  <Building2 size={20} strokeWidth={1.5} />
                </span>
                <div className="flex items-center gap-1">
                  <span className="mr-2 inline-flex items-center gap-1.5 font-data text-body-sm text-ink-600">
                    <Users size={14} strokeWidth={1.5} className="text-ink-400" />
                    {dept.employeeCount}
                  </span>
                  <IconButton
                    size="sm"
                    label="Edit department"
                    icon={<Pencil size={15} strokeWidth={1.5} />}
                    onClick={() => openEdit(dept)}
                  />
                  <IconButton
                    size="sm"
                    label="Delete department"
                    icon={<Trash2 size={15} strokeWidth={1.5} />}
                    className="hover:text-danger-600"
                    onClick={() => setDeleting(dept)}
                  />
                </div>
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit department' : 'New department'}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button form="dept-form" type="submit" isLoading={isSubmitting}>
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" errorText={errors.name?.message} {...register('name')} />
          <Textarea label="Description" rows={3} {...register('description')} />
          {editing && (
            <Select
              label="Head of department"
              searchable
              value={headId}
              onChange={(v) => setHeadId(v as string)}
              options={employeeOptions}
            />
          )}
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete department"
        description={
          deleting
            ? `Are you sure you want to delete "${deleting.name}"? This cannot be undone.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteDepartment.isPending}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink-600">
          Departments with active employees cannot be deleted. Reassign their members first.
        </p>
      </Modal>
    </>
  );
}
