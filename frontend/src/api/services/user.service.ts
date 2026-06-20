import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay, paginate } from '../mock/helpers';
import { mockUsers } from '../mock/mockData';
import type { ApiResponse, Paginated, QueryParams, User } from '@/types';
import type { UserInviteFormValues } from '@/constants/validation.constants';

export const userService = {
  async list(params: QueryParams = {}): Promise<Paginated<User>> {
    if (USE_MOCKS) return delay(paginate(mockUsers, params, { searchFields: ['name', 'email'] }));
    const { data } = await axiosClient.get<ApiResponse<Paginated<User>>>(ENDPOINTS.users.list, {
      params,
    });
    return data.data;
  },

  async create(payload: UserInviteFormValues): Promise<User> {
    if (USE_MOCKS) {
      return delay({
        id: `usr_${Date.now()}`,
        ...payload,
        companyId: 'comp_001',
        isActive: true,
        createdAt: new Date().toISOString(),
      } as User);
    }
    const { data } = await axiosClient.post<ApiResponse<User>>(ENDPOINTS.users.create, payload);
    return data.data;
  },

  async update(id: string, payload: Partial<User>): Promise<User> {
    if (USE_MOCKS) {
      const found = mockUsers.find((u) => u.id === id)!;
      return delay({ ...found, ...payload });
    }
    const { data } = await axiosClient.patch<ApiResponse<User>>(ENDPOINTS.users.update(id), payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.delete(ENDPOINTS.users.remove(id));
  },
};
