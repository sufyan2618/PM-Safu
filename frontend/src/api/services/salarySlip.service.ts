import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapSalarySlip, periodToMonthYear, toPaginated } from '../mappers';
import { toQuery } from '../query';
import type { ApiSalarySlip } from '../dto';
import type { ApiEnvelope, Paginated, QueryParams, SalarySlip } from '@/types';

interface SlipListParams extends QueryParams {
  period?: string;
  paymentStatus?: string;
  employeeId?: string;
  payrollId?: string;
}

export const salarySlipService = {
  async list(params: SlipListParams = {}): Promise<Paginated<SalarySlip>> {
    const { period, ...rest } = params;
    const query = toQuery(rest);
    if (period) {
      const { month, year } = periodToMonthYear(period);
      query.month = month;
      query.year = year;
    }
    const { data } = await axiosClient.get<ApiEnvelope<ApiSalarySlip[]>>(
      ENDPOINTS.salarySlips.list,
      { params: query },
    );
    return toPaginated(data, mapSalarySlip);
  },

  async detail(id: string): Promise<SalarySlip> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiSalarySlip>>(
      ENDPOINTS.salarySlips.detail(id),
    );
    return mapSalarySlip(data.data);
  },

  async markPaid(id: string, paidOn?: string): Promise<void> {
    await axiosClient.patch(ENDPOINTS.salarySlips.markPaid(id), { paidOn });
  },
};
