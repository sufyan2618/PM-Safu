import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapCompany } from '../mappers';
import type { ApiCompany } from '../dto';
import type { ApiEnvelope, Address, Company } from '@/types';

export interface CompanySetupPayload {
  legalName?: string;
  industry?: string;
  brandColor?: string;
  address?: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  currency?: string;
  fiscalYearStartMonth?: number;
  completeOnboarding?: boolean;
}

export const companyService = {
  async me(): Promise<Company> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiCompany>>(ENDPOINTS.company.me);
    return mapCompany(data.data);
  },

  async setup(payload: CompanySetupPayload): Promise<Company> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiCompany>>(
      ENDPOINTS.company.setup,
      payload,
    );
    return mapCompany(data.data);
  },

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const form = new FormData();
    form.append('logo', file);
    const { data } = await axiosClient.post<ApiEnvelope<{ logoUrl: string }>>(
      ENDPOINTS.company.logo,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  async updateInvoiceSettings(payload: {
    prefix?: string;
    nextNumber?: number;
    numberPadding?: number;
    defaultPaymentTermsDays?: number;
    defaultTemplateId?: string;
  }): Promise<void> {
    await axiosClient.patch(ENDPOINTS.company.invoiceSettings, payload);
  },

  async updatePayrollSettings(payload: {
    payDay?: number;
    defaultWorkingDaysPerMonth?: number;
  }): Promise<void> {
    await axiosClient.patch(ENDPOINTS.company.payrollSettings, payload);
  },
};
