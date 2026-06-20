import { axiosClient } from './axiosClient';
import { ENDPOINTS } from './endpoints';
import type {
  ApiEnvelope,
  Company,
  CompanyListParams,
  CompanyUser,
  Paginated,
  PlatformStats,
  SuperAdmin,
} from '@/types';

interface LoginResult {
  accessToken: string;
  superAdmin: SuperAdmin;
}

type MeResult =
  | { type: 'super_admin'; superAdmin: SuperAdmin }
  | { type: 'user'; [key: string]: unknown };

export const authService = {
  async login(payload: { email: string; password: string }): Promise<LoginResult> {
    const { data } = await axiosClient.post<ApiEnvelope<LoginResult>>(
      ENDPOINTS.auth.superAdminLogin,
      payload,
    );
    return data.data;
  },

  async me(): Promise<MeResult> {
    const { data } = await axiosClient.get<ApiEnvelope<MeResult>>(ENDPOINTS.auth.me);
    return data.data;
  },

  async logout(): Promise<void> {
    await axiosClient.post(ENDPOINTS.auth.logout);
  },
};

function buildCompanyParams(params: CompanyListParams = {}): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
  if (params.sort) query.sort = params.sort;
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (typeof params.isActive === 'boolean') query.isActive = String(params.isActive);
  return query;
}

export const superAdminService = {
  async dashboard(): Promise<PlatformStats> {
    const { data } = await axiosClient.get<ApiEnvelope<PlatformStats>>(
      ENDPOINTS.superAdmin.dashboard,
    );
    return data.data;
  },

  async listCompanies(params: CompanyListParams = {}): Promise<Paginated<Company>> {
    const { data } = await axiosClient.get<ApiEnvelope<Company[]>>(ENDPOINTS.superAdmin.companies, {
      params: buildCompanyParams(params),
    });
    const meta = data.meta;
    return {
      items: data.data,
      page: meta?.page ?? params.page ?? 1,
      limit: meta?.limit ?? params.limit ?? 20,
      total: meta?.total ?? data.data.length,
      totalPages: meta?.totalPages ?? 1,
    };
  },

  async getCompany(id: string): Promise<{ company: Company; userCount: number }> {
    const { data } = await axiosClient.get<ApiEnvelope<{ company: Company; userCount: number }>>(
      ENDPOINTS.superAdmin.company(id),
    );
    return data.data;
  },

  async listCompanyUsers(id: string): Promise<CompanyUser[]> {
    const { data } = await axiosClient.get<ApiEnvelope<CompanyUser[]>>(
      ENDPOINTS.superAdmin.companyUsers(id),
    );
    return data.data;
  },

  async approve(id: string): Promise<Company> {
    const { data } = await axiosClient.patch<ApiEnvelope<Company>>(
      ENDPOINTS.superAdmin.approve(id),
    );
    return data.data;
  },

  async reject(id: string, reason: string): Promise<Company> {
    const { data } = await axiosClient.patch<ApiEnvelope<Company>>(
      ENDPOINTS.superAdmin.reject(id),
      { reason },
    );
    return data.data;
  },

  async suspend(id: string): Promise<Company> {
    const { data } = await axiosClient.patch<ApiEnvelope<Company>>(
      ENDPOINTS.superAdmin.suspend(id),
    );
    return data.data;
  },

  async reactivate(id: string): Promise<Company> {
    const { data } = await axiosClient.patch<ApiEnvelope<Company>>(
      ENDPOINTS.superAdmin.reactivate(id),
    );
    return data.data;
  },
};
