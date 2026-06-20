import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsNav } from './SettingsNav';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { FileUpload } from '@/components/ui/FileUpload';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { profileSchema, type ProfileFormValues } from '@/constants/validation.constants';

export function ProfileSettingsPage() {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email },
  });

  function onSubmit(values: ProfileFormValues) {
    updateUser(values);
    toast.success('Profile updated');
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and company preferences." />
      <SettingsNav />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Personal details" ruled />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name ?? 'U'} src={user?.avatarUrl} size="lg" />
              <FileUpload
                accept="image/png,image/jpeg"
                preview="image"
                label="Upload new photo"
                hint="PNG or JPG, up to 5MB"
                onFilesSelected={() => toast.success('Photo uploaded')}
              />
            </div>
            <Input label="Full name" errorText={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" errorText={errors.email?.message} {...register('email')} />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Password" ruled />
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Password changed');
            }}
          >
            <Input label="Current password" type="password" placeholder="••••••••" />
            <Input label="New password" type="password" placeholder="••••••••" />
            <Button type="submit" variant="outline" fullWidth>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
