import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapClient, mapInvoice, toPaginated } from '../mappers';
import { toQuery } from '../query';
import type { ApiClient, ApiInvoice } from '../dto';
import type { ApiEnvelope, Client, Invoice, Paginated, QueryParams } from '@/types';
import type { ClientFormValues } from '@/constants/validation.constants';

function toBody(payload: Partial<ClientFormValues>) {
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    companyNameOfClient: payload.companyName,
    billingAddress: payload.address ? { line1: payload.address } : undefined,
    taxId: payload.taxId,
    notes: payload.notes,
  };
}

export const clientService = {
  async list(params: QueryParams = {}): Promise<Paginated<Client>> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiClient[]>>(ENDPOINTS.clients.list, {
      params: toQuery(params),
    });
    return toPaginated(data, mapClient);
  },

  async detail(id: string): Promise<Client> {
    const { data } = await axiosClient.get<ApiEnvelope<{ client: ApiClient }>>(
      ENDPOINTS.clients.detail(id),
    );
    return mapClient(data.data.client);
  },

  async invoices(id: string): Promise<Invoice[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiInvoice[]>>(
      ENDPOINTS.clients.invoices(id),
    );
    return data.data.map(mapInvoice);
  },

  async create(payload: ClientFormValues): Promise<Client> {
    const { data } = await axiosClient.post<ApiEnvelope<ApiClient>>(
      ENDPOINTS.clients.create,
      toBody(payload),
    );
    return mapClient(data.data);
  },

  async update(id: string, payload: Partial<ClientFormValues>): Promise<Client> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiClient>>(
      ENDPOINTS.clients.update(id),
      toBody(payload),
    );
    return mapClient(data.data);
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.clients.remove(id));
  },
};
