import type { User } from './user.types';

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
  user: User;
  token: string;
  onboardingCompleted: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}
