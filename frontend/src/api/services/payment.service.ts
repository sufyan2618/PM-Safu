import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiEnvelope } from '@/types';

export interface ConnectStatus {
  connected: boolean;
  accountId?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export const paymentService = {
  async connectStatus(): Promise<ConnectStatus> {
    const { data } = await axiosClient.get<ApiEnvelope<ConnectStatus>>(
      ENDPOINTS.payments.connectStatus,
    );
    return data.data;
  },

  async startOnboarding(): Promise<{ url: string }> {
    const { data } = await axiosClient.post<ApiEnvelope<{ url: string }>>(
      ENDPOINTS.payments.connectOnboard,
    );
    return data.data;
  },
};
