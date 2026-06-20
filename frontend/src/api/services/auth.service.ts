import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay } from '../mock/helpers';
import { mockCurrentUser } from '../mock/mockData';
import type {
  ApiResponse,
  AuthResult,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from '@/types';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    if (USE_MOCKS) {
      return delay({
        user: { ...mockCurrentUser, email: payload.email },
        token: 'mock-access-token',
        onboardingCompleted: true,
      });
    }
    const { data } = await axiosClient.post<ApiResponse<AuthResult>>(ENDPOINTS.auth.login, payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    if (USE_MOCKS) {
      return delay({
        user: { ...mockCurrentUser, name: payload.adminName, email: payload.email },
        token: 'mock-access-token',
        onboardingCompleted: false,
      });
    }
    const { data } = await axiosClient.post<ApiResponse<AuthResult>>(
      ENDPOINTS.auth.register,
      payload,
    );
    return data.data;
  },

  async me(): Promise<User> {
    if (USE_MOCKS) return delay(mockCurrentUser);
    const { data } = await axiosClient.get<ApiResponse<User>>(ENDPOINTS.auth.me);
    return data.data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.post(ENDPOINTS.auth.forgotPassword, payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.post(ENDPOINTS.auth.resetPassword, payload);
  },

  async logout(): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.post(ENDPOINTS.auth.logout);
  },
};
