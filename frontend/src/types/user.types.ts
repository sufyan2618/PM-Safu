export type Role = 'admin' | 'manager' | 'accountant' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  companyId: string;
  isActive: boolean;
  createdAt: string;
}
