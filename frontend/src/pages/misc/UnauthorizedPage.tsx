import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes.constants';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-warn-100">
        <ShieldAlert size={30} strokeWidth={1.5} className="text-warn-600" />
      </span>
      <h1 className="text-display-sm text-ink-900">Access restricted</h1>
      <p className="mt-2 max-w-sm text-body text-ink-600">
        You don't have permission to view this page. Contact your administrator if you think this is
        a mistake.
      </p>
      <Button className="mt-6" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Back to dashboard
      </Button>
    </div>
  );
}
