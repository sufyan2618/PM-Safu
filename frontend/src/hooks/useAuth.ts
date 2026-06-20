import { useNavigate } from 'react-router-dom';
import { authService } from '@/api/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes.constants';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types';

export function useAuth() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  return {
    user,
    company,
    isAuthenticated,
    async signIn(payload: LoginPayload) {
      const result = await authService.login(payload);
      setSession({ user: result.user, token: result.accessToken, company: result.company });
      navigate(result.company.onboardingCompleted ? ROUTES.DASHBOARD : ROUTES.ONBOARDING, {
        replace: true,
      });
      return result;
    },
    async signUp(payload: RegisterPayload) {
      // Registration creates a *pending* company — no session is established until
      // a super admin approves it, so we route back to login with a notice.
      const summary = await authService.register(payload);
      navigate(ROUTES.LOGIN, { replace: true, state: { registered: true } });
      return summary;
    },
    async forgotPassword(payload: ForgotPasswordPayload) {
      await authService.forgotPassword(payload);
    },
    async resetPassword(payload: ResetPasswordPayload) {
      await authService.resetPassword(payload);
    },
    async signOut() {
      await authService.logout().catch(() => undefined);
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
    },
  };
}
