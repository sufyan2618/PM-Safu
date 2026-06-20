import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes.constants';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/constants/validation.constants';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    await forgotPassword(values);
    setSent(true);
  }

  return (
    <AuthLayout
      title={sent ? 'Check your inbox' : 'Reset password'}
      subtitle={
        sent
          ? 'We sent a reset link to your email if an account exists.'
          : "Enter your email and we'll send you a reset link."
      }
      footer={
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 font-medium text-accent-600 hover:text-accent-500"
        >
          <ArrowLeft size={15} strokeWidth={1.5} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center rounded-xl border border-subtle bg-surface p-8 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
            <MailCheck size={22} strokeWidth={1.5} className="text-success-600" />
          </span>
          <p className="text-body-sm text-ink-600">
            Follow the instructions in the email to choose a new password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            errorText={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
