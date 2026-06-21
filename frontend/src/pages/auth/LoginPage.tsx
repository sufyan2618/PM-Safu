import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AxiosError } from 'axios';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/api/services/auth.service';
import { ROUTES } from '@/constants/routes.constants';
import { loginSchema, type LoginFormValues } from '@/constants/validation.constants';

interface ApiErrorBody {
  message?: string;
  errors?: { field: string; message: string }[];
}

export function LoginPage() {
  const { signIn } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered;
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setUnverifiedEmail(null);
    try {
      await signIn(values);
      toast.success('Welcome back');
    } catch (error) {
      const body =
        error instanceof AxiosError
          ? (error.response?.data as ApiErrorBody | undefined)
          : undefined;
      const notVerified = body?.errors?.some((e) => e.message === 'EMAIL_NOT_VERIFIED');
      if (notVerified) {
        setUnverifiedEmail(values.email);
        toast.error('Email not verified', 'Please verify your email before signing in.');
        return;
      }
      toast.error('Unable to sign in', body?.message ?? 'Check your credentials and try again.');
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await authService.resendVerification(unverifiedEmail);
      toast.success('Verification email sent', 'Check your inbox for a fresh link.');
    } catch {
      toast.error('Could not resend the verification email');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your details to access your workspace."
      footer={
        <>
          New to PM-Safu?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-accent-600 hover:text-accent-500">
            Create an account
          </Link>
        </>
      }
    >
      {justRegistered && (
        <div className="mb-5 rounded-lg border border-accent-600/30 bg-accent-100 px-4 py-3 text-body-sm text-ink-700">
          <p className="font-medium text-ink-900">Verify your email to continue</p>
          <p className="mt-1">
            We've sent a verification link to your inbox. Confirm your email to submit your company
            for review — we'll email you again once an administrator approves it, then you can sign
            in.
          </p>
        </div>
      )}
      {unverifiedEmail && (
        <div className="mb-5 rounded-lg border border-danger-600/30 bg-danger-100 px-4 py-3 text-body-sm text-ink-700">
          <p>Your email address hasn't been verified yet.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 px-0"
            isLoading={resending}
            onClick={handleResend}
          >
            Resend verification email
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          leftIcon={<Mail size={16} strokeWidth={1.5} />}
          errorText={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={16} strokeWidth={1.5} />}
          errorText={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-body-sm font-medium text-accent-600 hover:text-accent-500"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
