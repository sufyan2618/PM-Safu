import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUserById,
  useUsers,
} from '@/hooks/queries/useUsers';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { ROLE_LABELS, ROLE_OPTIONS } from '@/constants/roles.constants';
import { userInviteSchema, type UserInviteFormValues } from '@/constants/validation.constants';
import type { Role, User } from '@/types';

export function UsersAndRolesPage() {
  const toast = useToast();
  const { data, isLoading } = useUsers({ pageSize: 50 });
  const createUser = useCreateUser();
  const updateUser = useUpdateUserById();
  const deleteUser = useDeleteUser();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<Role>('accountant');
  const [removeUser, setRemoveUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserInviteFormValues>({
    resolver: zodResolver(userInviteSchema),
    defaultValues: { role: 'accountant' },
  });
  const role = useWatch({ control, name: 'role' });

  async function onSubmit(values: UserInviteFormValues) {
    await createUser.mutateAsync(values);
    toast.success('Invitation sent', `${values.email} has been invited.`);
    reset();
    setOpen(false);
  }

  function openEdit(user: User) {
    setEditUser(user);
    setEditRole(user.role);
  }

  async function saveRole() {
    if (!editUser) return;
    try {
      await updateUser.mutateAsync({ id: editUser.id, payload: { role: editRole } });
      toast.success('Role updated');
      setEditUser(null);
    } catch (err) {
      toast.error(apiMessage(err) ?? 'Could not update role');
    }
  }

  async function toggleActive(user: User) {
    try {
      await updateUser.mutateAsync({ id: user.id, payload: { isActive: !user.isActive } });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(apiMessage(err) ?? 'Could not update user');
    }
  }

  async function confirmRemove() {
    if (!removeUser) return;
    try {
      await deleteUser.mutateAsync(removeUser.id);
      toast.success('User removed');
      setRemoveUser(null);
    } catch (err) {
      toast.error(apiMessage(err) ?? 'Could not remove user');
    }
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
      render: (row) => {
        const isSelf = row.id === currentUserId;
        return (
          <Dropdown
            trigger={<IconButton label="Actions" size="sm" icon={<MoreVertical size={16} />} />}
            items={[
              { label: 'Edit role', onClick: () => openEdit(row), disabled: isSelf },
              {
                label: row.isActive ? 'Deactivate' : 'Activate',
                tone: row.isActive ? ('danger' as const) : ('default' as const),
                onClick: () => toggleActive(row),
                disabled: isSelf,
              },
              {
                label: 'Remove',
                tone: 'danger',
                onClick: () => setRemoveUser(row),
                disabled: isSelf,
              },
            ]}
          />
        );
      },
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
            value={role}
            onChange={(v) => setValue('role', v as Role)}
            options={ROLE_OPTIONS}
          />
        </form>
      </Modal>

      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit role"
        description={editUser ? `Update the role for ${editUser.name}.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button isLoading={updateUser.isPending} onClick={saveRole}>
              Save role
            </Button>
          </>
        }
      >
        <Select
          label="Role"
          value={editRole}
          onChange={(v) => setEditRole(v as Role)}
          options={ROLE_OPTIONS}
        />
      </Modal>

      <Modal
        open={!!removeUser}
        onClose={() => setRemoveUser(null)}
        title="Remove user?"
        description="They will lose access immediately. You can re-invite them later."
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" isLoading={deleteUser.isPending} onClick={confirmRemove}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink-600">
          Are you sure you want to remove{' '}
          <span className="font-medium text-ink-900">{removeUser?.name}</span>?
        </p>
      </Modal>
    </>
  );
}

function apiMessage(err: unknown): string | undefined {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
}
