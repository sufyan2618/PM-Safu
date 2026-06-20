import type { User } from './user.types';
import type { CompanySummary } from './company.types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  companyName: string;
  adminName: string;
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  user: User;
  company: CompanySummary;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
