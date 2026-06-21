import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { authService } from '@/api/services/auth.service';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes.constants';

type Status = 'verifying' | 'success' | 'error' | 'missing';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [status, setStatus] = useState<Status>(token && email ? 'verifying' : 'missing');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [resending, setResending] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !token || !email) return;
    attempted.current = true;

    authService
      .verifyEmail({ token, email })
      .then((result) => {
        setSuccessMessage(result.message);
        setPendingApproval(result.pendingApproval);
        setStatus('success');
      })
      .catch((err) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setMessage(msg ?? 'This verification link is invalid or has expired.');
        setStatus('error');
      });
  }, [token, email]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      await authService.resendVerification(email);
      toast.success('Verification email sent', 'Check your inbox for a fresh link.');
    } catch {
      toast.error('Could not resend the verification email');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Confirming your email address activates your account."
      footer={
        <Link to={ROUTES.LOGIN} className="font-medium text-accent-600 hover:text-accent-500">
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 size={40} className="animate-spin text-accent-600" />
            <p className="text-body text-ink-600">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-accent-600" />
            <p className="text-body text-ink-700">
              {successMessage || 'Your email has been verified.'}
            </p>
            {pendingApproval && (
              <p className="text-body-sm text-ink-500">
                You'll be able to sign in once an administrator approves your company.
              </p>
            )}
            <Button fullWidth onClick={() => navigate(ROUTES.LOGIN)}>
              {pendingApproval ? 'Back to sign in' : 'Go to sign in'}
            </Button>
          </>
        )}

        {(status === 'error' || status === 'missing') && (
          <>
            <XCircle size={48} className="text-danger-600" />
            <p className="text-body text-ink-700">
              {status === 'missing'
                ? 'This verification link is incomplete. Please use the link from your email.'
                : message}
            </p>
            {email && (
              <Button fullWidth isLoading={resending} onClick={handleResend}>
                Resend verification email
              </Button>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  );
}
