import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay, paginate } from '../mock/helpers';
import { mockInvoices, mockTemplates } from '../mock/mockData';
import type {
  ApiResponse,
  Invoice,
  InvoiceStatus,
  InvoiceTemplate,
  Paginated,
  QueryParams,
} from '@/types';
import type { InvoiceFormValues } from '@/constants/validation.constants';

interface InvoiceListParams extends QueryParams {
  status?: InvoiceStatus;
  clientId?: string;
}

function buildInvoice(payload: InvoiceFormValues): Invoice {
  const lineItems = payload.lineItems.map((item, i) => {
    const total = item.quantity * item.unitPrice;
    return {
      id: `li_new_${i}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate ?? 0,
      total,
    };
  });
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const taxTotal = lineItems.reduce((s, li) => s + (li.total * (li.taxRate ?? 0)) / 100, 0);
  const total = subtotal + taxTotal;
  return {
    id: `inv_${Date.now()}`,
    invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    clientId: payload.clientId,
    status: 'draft',
    issueDate: payload.issueDate,
    dueDate: payload.dueDate,
    lineItems,
    subtotal,
    taxTotal: Math.round(taxTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    amountPaid: 0,
    amountDue: Math.round(total * 100) / 100,
    currency: 'USD',
    templateId: payload.templateId,
    notes: payload.notes,
    terms: payload.terms,
    paymentHistory: [],
    createdAt: new Date().toISOString(),
  };
}

export const invoiceService = {
  async list(params: InvoiceListParams = {}): Promise<Paginated<Invoice>> {
    if (USE_MOCKS) {
      let items = mockInvoices;
      if (params.status) items = items.filter((i) => i.status === params.status);
      if (params.clientId) items = items.filter((i) => i.clientId === params.clientId);
      return delay(paginate(items, params, { searchFields: ['invoiceNumber'] }));
    }
    const { data } = await axiosClient.get<ApiResponse<Paginated<Invoice>>>(
      ENDPOINTS.invoices.list,
      { params },
    );
    return data.data;
  },

  async detail(id: string): Promise<Invoice> {
    if (USE_MOCKS) {
      const found = mockInvoices.find((i) => i.id === id);
      if (!found) throw new Error('Invoice not found');
      return delay(found);
    }
    const { data } = await axiosClient.get<ApiResponse<Invoice>>(ENDPOINTS.invoices.detail(id));
    return data.data;
  },

  async byShareToken(token: string): Promise<Invoice> {
    if (USE_MOCKS) {
      const found = mockInvoices.find((i) => i.shareToken === token) ?? mockInvoices[0];
      return delay(found);
    }
    const { data } = await axiosClient.get<ApiResponse<Invoice>>(
      ENDPOINTS.invoices.publicShare(token),
    );
    return data.data;
  },

  async create(payload: InvoiceFormValues): Promise<Invoice> {
    if (USE_MOCKS) return delay(buildInvoice(payload));
    const { data } = await axiosClient.post<ApiResponse<Invoice>>(
      ENDPOINTS.invoices.create,
      payload,
    );
    return data.data;
  },

  async update(id: string, payload: InvoiceFormValues): Promise<Invoice> {
    if (USE_MOCKS) return delay({ ...buildInvoice(payload), id });
    const { data } = await axiosClient.patch<ApiResponse<Invoice>>(
      ENDPOINTS.invoices.update(id),
      payload,
    );
    return data.data;
  },

  async send(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.patch(ENDPOINTS.invoices.send(id));
  },

  async recordPayment(
    id: string,
    payload: { amount: number; method: string; reference?: string },
  ): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.post(ENDPOINTS.invoices.recordPayment(id), payload);
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.delete(ENDPOINTS.invoices.remove(id));
  },

  async templates(): Promise<InvoiceTemplate[]> {
    if (USE_MOCKS) return delay(mockTemplates);
    const { data } = await axiosClient.get<ApiResponse<InvoiceTemplate[]>>(
      ENDPOINTS.invoiceTemplates.list,
    );
    return data.data;
  },
};
