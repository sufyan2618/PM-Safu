export type Role = 'company_admin' | 'hr_manager' | 'accountant' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  companyId: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}
