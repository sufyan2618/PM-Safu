import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import type {
  AiChatMessage,
  AiInvoiceDraftResponse,
  AiPayrollInsights,
  AiStatus,
  ApiEnvelope,
} from '@/types';

interface InvoiceDraftPayload {
  prompt: string;
  clientId?: string;
  dueDate?: string;
}

interface DescribePayload {
  name: string;
  hours?: number;
  context?: string;
}

/** Maps an AI request error to a user-friendly message (handles 503 unconfigured / 429 rate limit). */
export function aiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong with the AI request.',
): string {
  const e = err as { response?: { status?: number; data?: { message?: string } } };
  const status = e?.response?.status;
  if (status === 503) return 'AI features are not configured on this server.';
  if (status === 429) return 'Too many AI requests — please wait a moment and try again.';
  return e?.response?.data?.message ?? fallback;
}

export const aiService = {
  async status(): Promise<AiStatus> {
    const { data } = await axiosClient.get<ApiEnvelope<AiStatus>>(ENDPOINTS.ai.status);
    return data.data;
  },

  async invoiceDraft(payload: InvoiceDraftPayload): Promise<AiInvoiceDraftResponse> {
    const { data } = await axiosClient.post<ApiEnvelope<AiInvoiceDraftResponse>>(
      ENDPOINTS.ai.invoiceDraft,
      payload,
    );
    return data.data;
  },

  async describeItem(payload: DescribePayload): Promise<string> {
    const { data } = await axiosClient.post<ApiEnvelope<{ description: string }>>(
      ENDPOINTS.ai.invoiceDescribe,
      payload,
    );
    return data.data.description;
  },

  async payrollInsights(id: string, refresh = false): Promise<AiPayrollInsights> {
    const { data } = await axiosClient.get<ApiEnvelope<AiPayrollInsights>>(
      ENDPOINTS.ai.payrollInsights(id),
      { params: refresh ? { refresh: true } : undefined },
    );
    return data.data;
  },

  async payrollChat(payload: { messages: AiChatMessage[]; payrollId?: string }): Promise<string> {
    const { data } = await axiosClient.post<ApiEnvelope<{ message: string; cached: boolean }>>(
      ENDPOINTS.ai.payrollChat,
      payload,
    );
    return data.data.message;
  },
};
