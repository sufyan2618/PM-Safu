import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreVertical, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsNav } from './SettingsNav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { DataTable, type Column } from '@/components/ui/Table';
import { useCreateUser, useUsers } from '@/hooks/queries/useUsers';
import { useToast } from '@/hooks/useToast';
import { ROLE_LABELS, ROLE_OPTIONS } from '@/constants/roles.constants';
import { userInviteSchema, type UserInviteFormValues } from '@/constants/validation.constants';
import type { Role, User } from '@/types';

export function UsersAndRolesPage() {
  const toast = useToast();
  const { data, isLoading } = useUsers({ pageSize: 50 });
  const createUser = useCreateUser();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserInviteFormValues>({
    resolver: zodResolver(userInviteSchema),
    defaultValues: { role: 'accountant' },
  });

  async function onSubmit(values: UserInviteFormValues) {
    await createUser.mutateAsync(values);
    toast.success('Invitation sent', `${values.email} has been invited.`);
    reset();
    setOpen(false);
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.name}</p>
            <p className="truncate text-caption text-ink-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge tone="neutral">{ROLE_LABELS[row.role]}</Badge>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.isActive ? 'success' : 'neutral'} dot>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => (
        <Dropdown
          trigger={<IconButton label="Actions" size="sm" icon={<MoreVertical size={16} />} />}
          items={[
            { label: 'Edit role', onClick: () => toast.info('Edit role') },
            { label: 'Deactivate', tone: 'danger', onClick: () => toast.info('Deactivated') },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and company preferences."
        actions={
          <Button leftIcon={<UserPlus size={16} />} onClick={() => setOpen(true)}>
            Invite user
          </Button>
        }
      />
      <SettingsNav />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        rowKey={(row) => row.id}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a user"
        description="They'll receive an email to set up their account."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="invite-form" type="submit" isLoading={isSubmitting}>
              Send invite
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" errorText={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" errorText={errors.email?.message} {...register('email')} />
          <Select
            label="Role"
            value={watch('role')}
            onChange={(v) => setValue('role', v as Role)}
            options={ROLE_OPTIONS}
          />
        </form>
      </Modal>
    </>
  );
}
