import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import type { ApiEnvelope } from '@/types';

export interface AppNotification {
  _id: string;
  type: 'invoice_paid' | 'invoice_overdue' | 'payroll_finalized' | 'salary_slip_sent';
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(limit = 30): Promise<NotificationsResponse> {
    const { data } = await axiosClient.get<ApiEnvelope<NotificationsResponse>>(
      ENDPOINTS.notifications.list,
      { params: { limit } },
    );
    return data.data;
  },

  async markAllRead(): Promise<void> {
    await axiosClient.patch(ENDPOINTS.notifications.markAllRead);
  },

  async markOneRead(id: string): Promise<AppNotification> {
    const { data } = await axiosClient.patch<ApiEnvelope<AppNotification>>(
      ENDPOINTS.notifications.markOneRead(id),
    );
    return data.data;
  },
};
