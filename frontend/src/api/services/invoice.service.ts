import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapInvoice, mapInvoiceTemplate, toPaginated } from '../mappers';
import { toQuery } from '../query';
import type { ApiInvoice, ApiInvoiceTemplate } from '../dto';
import type {
  ApiEnvelope,
  Invoice,
  InvoiceStatus,
  InvoiceTemplate,
  Paginated,
  PaymentMethod,
  QueryParams,
} from '@/types';
import type { InvoiceFormValues } from '@/constants/validation.constants';

interface InvoiceListParams extends QueryParams {
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function toInvoiceBody(payload: InvoiceFormValues) {
  return {
    clientId: payload.clientId,
    templateId: payload.templateId || undefined,
    issueDate: payload.issueDate,
    dueDate: payload.dueDate,
    items: payload.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate ?? 0,
    })),
    notes: payload.notes,
    termsAndConditions: payload.terms,
  };
}

export const invoiceService = {
  async list(params: InvoiceListParams = {}): Promise<Paginated<Invoice>> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiInvoice[]>>(ENDPOINTS.invoices.list, {
      params: toQuery(params),
    });
    return toPaginated(data, mapInvoice);
  },

  async detail(id: string): Promise<Invoice> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiInvoice>>(ENDPOINTS.invoices.detail(id));
    return mapInvoice(data.data);
  },

  async byShareToken(token: string): Promise<Invoice> {
    const { data } = await axiosClient.get<ApiEnvelope<{ invoice: ApiInvoice }>>(
      ENDPOINTS.invoices.publicShare(token),
    );
    return mapInvoice(data.data.invoice);
  },

  async create(payload: InvoiceFormValues): Promise<Invoice> {
    const { data } = await axiosClient.post<ApiEnvelope<ApiInvoice>>(
      ENDPOINTS.invoices.create,
      toInvoiceBody(payload),
    );
    return mapInvoice(data.data);
  },

  async update(id: string, payload: InvoiceFormValues): Promise<Invoice> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiInvoice>>(
      ENDPOINTS.invoices.update(id),
      toInvoiceBody(payload),
    );
    return mapInvoice(data.data);
  },

  async send(id: string): Promise<Invoice> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiInvoice>>(ENDPOINTS.invoices.send(id));
    return mapInvoice(data.data);
  },

  async recordPayment(
    id: string,
    payload: { amount: number; method: PaymentMethod | string; reference?: string; paidOn?: string },
  ): Promise<Invoice> {
    const { data } = await axiosClient.post<ApiEnvelope<ApiInvoice>>(
      ENDPOINTS.invoices.recordPayment(id),
      payload,
    );
    return mapInvoice(data.data);
  },

  async cancel(id: string, reason?: string): Promise<Invoice> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiInvoice>>(
      ENDPOINTS.invoices.cancel(id),
      { reason },
    );
    return mapInvoice(data.data);
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.invoices.remove(id));
  },

  async templates(): Promise<InvoiceTemplate[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiInvoiceTemplate[]>>(
      ENDPOINTS.invoiceTemplates.list,
    );
    return data.data.map(mapInvoiceTemplate);
  },

  async updateTemplate(id: string, template: InvoiceTemplate): Promise<InvoiceTemplate> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiInvoiceTemplate>>(
      ENDPOINTS.invoiceTemplates.update(id),
      {
        name: template.name,
        baseTheme: template.layout,
        design: {
          branding: { primaryColor: template.primaryColor, accentColor: template.accentColor },
          typography: { fontFamily: template.fontFamily },
        },
      },
    );
    return mapInvoiceTemplate(data.data);
  },
};
