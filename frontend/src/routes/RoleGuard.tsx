import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes.constants';
import type { Role } from '@/types';

export function RoleGuard({ allow }: { allow: Role[] }) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allow.includes(role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }
  return <Outlet />;
}

/**
 * Sends self-service staff to their own workspace instead of the company
 * dashboard, while leaving every other role on the dashboard.
 */
export function StaffHomeRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'staff') {
    return <Navigate to={ROUTES.SALARY_SLIPS} replace />;
  }
  return <Outlet />;
}
