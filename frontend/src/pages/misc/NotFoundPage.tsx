import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes.constants';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-data text-[64px] font-semibold leading-none text-accent-600">404</p>
      <div className="my-5 flex flex-col items-center gap-1">
        <span className="ledger-rule w-24 border-t-2" />
        <span className="ledger-rule w-16 border-t-2" />
      </div>
      <h1 className="text-display-sm text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-body text-ink-600">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Back to dashboard
      </Button>
    </div>
  );
}
