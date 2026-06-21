import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/api/services/user.service';
import { authService } from '@/api/services/auth.service';
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
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  // Local avatar preview (blob URL) shown immediately on file pick
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Avatar must be under 5 MB.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Invalid file type', 'Only PNG, JPG, or WebP images are allowed.');
      return;
    }

    // Show local preview immediately
    setAvatarPreview(URL.createObjectURL(file));

    setUploadingAvatar(true);
    try {
      const { avatarUrl } = await userService.uploadMyAvatar(file);
      // Replace local blob with real server URL so it persists across refreshes
      setAvatarPreview(avatarUrl);
      updateUser({ avatarUrl });
      toast.success('Photo updated');
    } catch {
      setAvatarPreview(null);
      toast.error('Upload failed', 'Could not save your photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Reset the input so the same file can be re-selected if needed
      e.target.value = '';
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    try {
      const updated = await userService.updateMyProfile({ name: values.name });
      updateUser({ name: updated.name });
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed', 'Could not save your profile. Please try again.');
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password too short', 'Use at least 8 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      toast.error('Could not change password', 'Check your current password and try again.');
    } finally {
      setChangingPassword(false);
    }
  }

  const displayAvatar = avatarPreview ?? user?.avatarUrl;

  return (
    <>
      <PageHeader title="Profile" description="Manage your personal account details." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Personal details" ruled />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={user?.name ?? 'U'} src={displayAvatar} size="lg" />
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="avatar-upload"
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-strong px-3 py-1.5 text-body-sm font-medium text-ink-700 transition-colors hover:bg-sunken ${
                    uploadingAvatar ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  {uploadingAvatar ? 'Uploading…' : 'Upload new photo'}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                />
                <p className="mt-1 text-caption text-ink-400">PNG, JPG or WebP · up to 5 MB</p>
              </div>
            </div>

            <Input label="Full name" errorText={errors.name?.message} {...register('name')} />
            <Input
              label="Email"
              type="email"
              disabled
              helperText="Contact your admin to change your email address."
              {...register('email')}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Password" ruled />
          <form className="space-y-4" onSubmit={onChangePassword}>
            <Input
              label="Current password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button type="submit" variant="outline" fullWidth isLoading={changingPassword}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
