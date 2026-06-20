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
};
