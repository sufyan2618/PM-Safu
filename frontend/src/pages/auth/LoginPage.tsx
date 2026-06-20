import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes.constants';
import { loginSchema, type LoginFormValues } from '@/constants/validation.constants';

export function LoginPage() {
  const { signIn } = useAuth();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'amelia@northwind.co', password: 'password' },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await signIn(values);
      toast.success('Welcome back');
    } catch {
      toast.error('Unable to sign in', 'Check your credentials and try again.');
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your details to access your workspace."
      footer={
        <>
          New to Ledger?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-accent-600 hover:text-accent-500">
            Create an account
          </Link>
        </>
      }
    >
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
