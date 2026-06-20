import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapPayroll, mapSalarySlip, periodToMonthYear, toPaginated } from '../mappers';
import { toQuery } from '../query';
import type { ApiPayroll, ApiSalarySlip } from '../dto';
import type { ApiEnvelope, Paginated, PayrollRun, QueryParams, SalarySlip } from '@/types';

interface PayrollListParams extends QueryParams {
  year?: number;
  status?: string;
}

type ProcessResponse =
  | ApiPayroll
  | { payrollId: string; status: 'processing'; queued: true };

export const payrollService = {
  async list(params: PayrollListParams = {}): Promise<Paginated<PayrollRun>> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiPayroll[]>>(ENDPOINTS.payroll.list, {
      params: toQuery(params),
    });
    return toPaginated(data, mapPayroll);
  },

  async detail(id: string): Promise<PayrollRun> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiPayroll>>(ENDPOINTS.payroll.detail(id));
    return mapPayroll(data.data);
  },

  async slips(id: string): Promise<SalarySlip[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiSalarySlip[]>>(
      ENDPOINTS.payroll.slips(id),
    );
    return data.data.map(mapSalarySlip);
  },

  async process(payload: { period: string; employeeIds?: string[]; notes?: string }): Promise<PayrollRun> {
    const { month, year } = periodToMonthYear(payload.period);
    const { data } = await axiosClient.post<ApiEnvelope<ProcessResponse>>(ENDPOINTS.payroll.process, {
      month,
      year,
      employeeIds: payload.employeeIds,
      notes: payload.notes,
    });

    if ('_id' in data.data) {
      return mapPayroll(data.data);
    }
    // Queued for background processing — surface a placeholder run.
    return {
      id: data.data.payrollId,
      period: payload.period,
      status: 'processing',
      totalEmployees: payload.employeeIds?.length ?? 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async finalize(id: string): Promise<void> {
    await axiosClient.patch(ENDPOINTS.payroll.finalize(id));
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.payroll.remove(id));
  },
};
