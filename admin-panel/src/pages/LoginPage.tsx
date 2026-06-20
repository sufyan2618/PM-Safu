import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Brand } from '@/components/layout/Brand';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { authService } from '@/api/services';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const result = await authService.login(values);
      setSession({ superAdmin: result.superAdmin, token: result.accessToken });
      navigate('/', { replace: true });
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? 'Invalid credentials')
          : 'Something went wrong. Please try again.';
      setFormError(message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between px-6 py-5">
        <Brand />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
              <ShieldCheck size={24} strokeWidth={1.5} />
            </span>
            <h1 className="text-display-sm text-ink-900">Platform Console</h1>
            <p className="mt-1 text-body-sm text-ink-600">
              Sign in to manage company access and onboarding.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {formError && (
              <div className="rounded-lg border border-danger-600/40 bg-danger-100 px-3 py-2 text-body-sm text-danger-600">
                {formError}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="admin@platform.com"
              leftIcon={<Mail size={16} strokeWidth={1.5} />}
              errorText={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} strokeWidth={1.5} />}
              errorText={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-caption text-ink-400">
            Restricted access · Platform administrators only
          </p>
        </div>
      </main>
    </div>
  );
}
