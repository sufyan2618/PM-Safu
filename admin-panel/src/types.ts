export type CompanyStatus = 'pending' | 'approved' | 'rejected';

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Company {
  _id: string;
  companyName: string;
  registrationEmail: string;
  status: CompanyStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  legalName?: string;
  industry?: string;
  logoUrl?: string;
  brandColor?: string;
  address?: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  currency: string;
  fiscalYearStartMonth: number;
  createdAt: string;
  updatedAt: string;
}

export type CompanyRole = 'company_admin' | 'hr_manager' | 'accountant' | 'staff';

export interface CompanyUser {
  _id: string;
  companyId: string;
  name: string;
  email: string;
  role: CompanyRole;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
}

export interface PlatformStats {
  totalCompanies: number;
  pendingCompanies: number;
  approvedCompanies: number;
  activeUsers: number;
  totalInvoices: number;
  totalRevenueProcessed: number;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CompanyListParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: CompanyStatus;
  isActive?: boolean;
}
