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
  const { user, isAuthenticated, login, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    async signIn(payload: LoginPayload) {
      const result = await authService.login(payload);
      login(result.user, result.token, result.onboardingCompleted);
      navigate(ROUTES.DASHBOARD);
      return result;
    },
    async signUp(payload: RegisterPayload) {
      const result = await authService.register(payload);
      login(result.user, result.token, result.onboardingCompleted);
      navigate(ROUTES.DASHBOARD);
      return result;
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
      navigate(ROUTES.LOGIN);
    },
  };
}
