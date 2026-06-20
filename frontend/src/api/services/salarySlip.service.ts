import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay, paginate } from '../mock/helpers';
import { mockSalarySlips } from '../mock/mockData';
import type { ApiResponse, Paginated, QueryParams, SalarySlip } from '@/types';

interface SlipListParams extends QueryParams {
  period?: string;
  paymentStatus?: string;
  employeeId?: string;
}

export const salarySlipService = {
  async list(params: SlipListParams = {}): Promise<Paginated<SalarySlip>> {
    if (USE_MOCKS) {
      let items = mockSalarySlips;
      if (params.period) items = items.filter((s) => s.period === params.period);
      if (params.paymentStatus) items = items.filter((s) => s.paymentStatus === params.paymentStatus);
      if (params.employeeId) items = items.filter((s) => s.employeeId === params.employeeId);
      const flattened = items.map((s) => ({ ...s, employeeName: s.employee?.name ?? '' }));
      return delay(paginate(flattened, params, { searchFields: ['period'] }));
    }
    const { data } = await axiosClient.get<ApiResponse<Paginated<SalarySlip>>>(
      ENDPOINTS.salarySlips.list,
      { params },
    );
    return data.data;
  },

  async detail(id: string): Promise<SalarySlip> {
    if (USE_MOCKS) {
      const found = mockSalarySlips.find((s) => s.id === id) ?? mockSalarySlips[0];
      return delay(found);
    }
    const { data } = await axiosClient.get<ApiResponse<SalarySlip>>(
      ENDPOINTS.salarySlips.detail(id),
    );
    return data.data;
  },

  async markPaid(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.patch(ENDPOINTS.salarySlips.markPaid(id));
  },
};
