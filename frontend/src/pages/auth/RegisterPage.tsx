import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes.constants';
import { registerSchema, type RegisterFormValues } from '@/constants/validation.constants';

export function RegisterPage() {
  const { signUp } = useAuth();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await signUp({
        companyName: values.companyName,
        adminName: values.adminName,
        email: values.email,
        password: values.password,
      });
      toast.success(
        'Almost there — check your email',
        'We sent a verification link to confirm your address.',
      );
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
      toast.error('Registration failed', message ?? 'Please try again in a moment.');
    }
  }

  return (
    <AuthLayout
      title="Register your company"
      subtitle="Create your workspace. Access is granted once an administrator approves your company."
      footer={
        <>
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-accent-600 hover:text-accent-500">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Company name"
          placeholder="Northwind Trading Co."
          errorText={errors.companyName?.message}
          {...register('companyName')}
        />
        <Input
          label="Your name"
          placeholder="Jane Doe"
          errorText={errors.adminName?.message}
          {...register('adminName')}
        />
        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          errorText={errors.email?.message}
          {...register('email')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            errorText={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm"
            type="password"
            placeholder="••••••••"
            errorText={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
