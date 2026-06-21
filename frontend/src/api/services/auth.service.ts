import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapCompany, mapCompanySummary, mapUser } from '../mappers';
import type { ApiCompany, ApiUser } from '../dto';
import type {
  ApiEnvelope,
  AuthResult,
  ChangePasswordPayload,
  Company,
  CompanySummary,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from '@/types';

interface LoginResponse {
  accessToken: string;
  user: ApiUser;
  company: Parameters<typeof mapCompanySummary>[0];
}

export interface MeResult {
  type: 'user' | 'super_admin';
  user?: User;
  company?: CompanySummary;
}

export interface CompanyMembership {
  id: string;
  companyName: string;
  logoUrl?: string;
  role?: string;
  isCurrent: boolean;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    const { data } = await axiosClient.post<ApiEnvelope<LoginResponse>>(
      ENDPOINTS.auth.login,
      payload,
    );
    return {
      accessToken: data.data.accessToken,
      user: mapUser(data.data.user),
      company: mapCompanySummary(data.data.company),
    };
  },

  async register(payload: RegisterPayload): Promise<CompanySummary> {
    const { data } = await axiosClient.post<ApiEnvelope<Parameters<typeof mapCompanySummary>[0]>>(
      ENDPOINTS.auth.register,
      {
        companyName: payload.companyName,
        registrationEmail: payload.email,
        password: payload.password,
        adminName: payload.adminName,
      },
    );
    return mapCompanySummary(data.data);
  },

  async me(): Promise<MeResult> {
    const { data } = await axiosClient.get<
      ApiEnvelope<{ type: 'user' | 'super_admin'; user?: ApiUser; company?: Parameters<typeof mapCompanySummary>[0] }>
    >(ENDPOINTS.auth.me);
    return {
      type: data.data.type,
      user: data.data.user ? mapUser(data.data.user) : undefined,
      company: data.data.company ? mapCompanySummary(data.data.company) : undefined,
    };
  },

  async companyProfile(): Promise<Company> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiCompany>>(ENDPOINTS.company.me);
    return mapCompany(data.data);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await axiosClient.post(ENDPOINTS.auth.forgotPassword, payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await axiosClient.post(ENDPOINTS.auth.resetPassword, payload);
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await axiosClient.post(ENDPOINTS.auth.changePassword, payload);
  },

  async verifyEmail(payload: {
    token: string;
    email: string;
  }): Promise<{ message: string; pendingApproval: boolean }> {
    const { data } = await axiosClient.post<ApiEnvelope<{ pendingApproval?: boolean }>>(
      ENDPOINTS.auth.verifyEmail,
      payload,
    );
    return {
      message: data.message ?? 'Email verified successfully.',
      pendingApproval: data.data?.pendingApproval ?? false,
    };
  },

  async resendVerification(email: string): Promise<void> {
    await axiosClient.post(ENDPOINTS.auth.resendVerification, { email });
  },

  async myCompanies(): Promise<CompanyMembership[]> {
    const { data } = await axiosClient.get<ApiEnvelope<CompanyMembership[]>>(
      ENDPOINTS.auth.myCompanies,
    );
    return data.data;
  },

  async switchCompany(companyId: string): Promise<AuthResult> {
    const { data } = await axiosClient.post<ApiEnvelope<LoginResponse>>(
      ENDPOINTS.auth.switchCompany(companyId),
    );
    return {
      accessToken: data.data.accessToken,
      user: mapUser(data.data.user),
      company: mapCompanySummary(data.data.company),
    };
  },

  async logout(): Promise<void> {
    await axiosClient.post(ENDPOINTS.auth.logout);
  },
};
