import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay, paginate } from '../mock/helpers';
import { mockClients, mockInvoices } from '../mock/mockData';
import type { ApiResponse, Client, Invoice, Paginated, QueryParams } from '@/types';
import type { ClientFormValues } from '@/constants/validation.constants';

export const clientService = {
  async list(params: QueryParams = {}): Promise<Paginated<Client>> {
    if (USE_MOCKS) {
      return delay(paginate(mockClients, params, { searchFields: ['name', 'email', 'companyName'] }));
    }
    const { data } = await axiosClient.get<ApiResponse<Paginated<Client>>>(ENDPOINTS.clients.list, {
      params,
    });
    return data.data;
  },

  async detail(id: string): Promise<Client> {
    if (USE_MOCKS) {
      const found = mockClients.find((c) => c.id === id);
      if (!found) throw new Error('Client not found');
      return delay(found);
    }
    const { data } = await axiosClient.get<ApiResponse<Client>>(ENDPOINTS.clients.detail(id));
    return data.data;
  },

  async invoices(id: string): Promise<Invoice[]> {
    if (USE_MOCKS) return delay(mockInvoices.filter((i) => i.clientId === id));
    const { data } = await axiosClient.get<ApiResponse<Invoice[]>>(ENDPOINTS.clients.invoices(id));
    return data.data;
  },

  async create(payload: ClientFormValues): Promise<Client> {
    if (USE_MOCKS) {
      return delay({
        id: `cli_${Date.now()}`,
        ...payload,
        totalInvoiced: 0,
        outstandingBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      } as Client);
    }
    const { data } = await axiosClient.post<ApiResponse<Client>>(ENDPOINTS.clients.create, payload);
    return data.data;
  },

  async update(id: string, payload: Partial<ClientFormValues>): Promise<Client> {
    if (USE_MOCKS) {
      const found = mockClients.find((c) => c.id === id)!;
      return delay({ ...found, ...payload });
    }
    const { data } = await axiosClient.patch<ApiResponse<Client>>(
      ENDPOINTS.clients.update(id),
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.delete(ENDPOINTS.clients.remove(id));
  },
};
