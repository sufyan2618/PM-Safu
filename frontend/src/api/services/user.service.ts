import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapUser, toPaginated } from '../mappers';
import { toQuery } from '../query';
import type { ApiUser } from '../dto';
import type { ApiEnvelope, Paginated, QueryParams, Role, User } from '@/types';
import type { UserInviteFormValues } from '@/constants/validation.constants';

interface UserListParams extends QueryParams {
  role?: Role;
  isActive?: boolean;
}

export const userService = {
  async list(params: UserListParams = {}): Promise<Paginated<User>> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiUser[]>>(ENDPOINTS.users.list, {
      params: toQuery(params),
    });
    return toPaginated(data, mapUser);
  },

  async create(payload: UserInviteFormValues): Promise<User> {
    const { data } = await axiosClient.post<ApiEnvelope<ApiUser>>(ENDPOINTS.users.create, payload);
    return mapUser(data.data);
  },

  async update(
    id: string,
    payload: { name?: string; role?: Role; isActive?: boolean },
  ): Promise<User> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiUser>>(
      ENDPOINTS.users.update(id),
      payload,
    );
    return mapUser(data.data);
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.users.remove(id));
  },

  async updateMyProfile(payload: { name: string }): Promise<User> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiUser>>(
      ENDPOINTS.users.me,
      payload,
    );
    return mapUser(data.data);
  },

  async uploadMyAvatar(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await axiosClient.post<ApiEnvelope<{ avatarUrl: string }>>(
      ENDPOINTS.users.myAvatar,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },
};
