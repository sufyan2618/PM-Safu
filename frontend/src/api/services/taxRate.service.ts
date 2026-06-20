import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapTaxRate } from '../mappers';
import type { ApiTaxRate } from '../dto';
import type { ApiEnvelope, TaxRate } from '@/types';

export interface TaxRatePayload {
  name: string;
  rate: number;
  description?: string;
  isDefault?: boolean;
}

export const taxRateService = {
  async list(): Promise<TaxRate[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiTaxRate[]>>(ENDPOINTS.taxRates.list);
    return (data.data ?? []).map(mapTaxRate);
  },

  async create(payload: TaxRatePayload): Promise<TaxRate> {
    const { data } = await axiosClient.post<ApiEnvelope<ApiTaxRate>>(
      ENDPOINTS.taxRates.create,
      payload,
    );
    return mapTaxRate(data.data);
  },

  async update(id: string, payload: Partial<TaxRatePayload>): Promise<TaxRate> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiTaxRate>>(
      ENDPOINTS.taxRates.update(id),
      payload,
    );
    return mapTaxRate(data.data);
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.taxRates.remove(id));
  },
};
