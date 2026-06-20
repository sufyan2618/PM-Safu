import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes.constants';

/** Blocks the main app until the company has finished onboarding. */
export function OnboardingGuard() {
  const company = useAuthStore((s) => s.company);
  if (company && !company.onboardingCompleted) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }
  return <Outlet />;
}

/** Inverse guard: keep onboarded companies out of the setup wizard. */
export function OnboardingRedirect() {
  const company = useAuthStore((s) => s.company);
  if (company?.onboardingCompleted) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return <Outlet />;
}
