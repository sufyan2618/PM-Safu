import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay, paginate } from '../mock/helpers';
import { mockPayrollRuns, mockSalarySlips } from '../mock/mockData';
import type { ApiResponse, Paginated, PayrollRun, QueryParams, SalarySlip } from '@/types';

export const payrollService = {
  async list(params: QueryParams = {}): Promise<Paginated<PayrollRun>> {
    if (USE_MOCKS) return delay(paginate(mockPayrollRuns, params, { searchFields: ['period'] }));
    const { data } = await axiosClient.get<ApiResponse<Paginated<PayrollRun>>>(
      ENDPOINTS.payroll.list,
      { params },
    );
    return data.data;
  },

  async detail(id: string): Promise<PayrollRun> {
    if (USE_MOCKS) {
      const found = mockPayrollRuns.find((p) => p.id === id) ?? mockPayrollRuns[0];
      return delay(found);
    }
    const { data } = await axiosClient.get<ApiResponse<PayrollRun>>(ENDPOINTS.payroll.detail(id));
    return data.data;
  },

  async slips(id: string): Promise<SalarySlip[]> {
    if (USE_MOCKS) return delay(mockSalarySlips.map((s) => ({ ...s, payrollRunId: id })));
    const { data } = await axiosClient.get<ApiResponse<SalarySlip[]>>(ENDPOINTS.payroll.slips(id));
    return data.data;
  },

  async process(payload: { period: string; employeeIds?: string[] }): Promise<PayrollRun> {
    if (USE_MOCKS) {
      const gross = 116000;
      const deductions = Math.round(gross * 0.18);
      return delay({
        id: `pr_${Date.now()}`,
        period: payload.period,
        status: 'completed',
        totalEmployees: payload.employeeIds?.length ?? 11,
        totalGross: gross,
        totalDeductions: deductions,
        totalNet: gross - deductions,
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    const { data } = await axiosClient.post<ApiResponse<PayrollRun>>(
      ENDPOINTS.payroll.process,
      payload,
    );
    return data.data;
  },

  async finalize(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.patch(ENDPOINTS.payroll.finalize(id));
  },
};
