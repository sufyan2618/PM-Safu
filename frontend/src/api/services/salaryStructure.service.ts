import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapSalaryStructure } from '../mappers';
import type { ApiSalaryStructure } from '../dto';
import type { ApiEnvelope, SalaryComponent, SalaryStructure } from '@/types';

export interface SalaryStructurePatch {
  name?: string;
  basic?: number;
  allowances?: SalaryComponent[];
  deductions?: SalaryComponent[];
  effectiveFrom?: string;
}

function toComponentBody(items: SalaryComponent[] = []) {
  return items
    .filter((item) => item.label.trim().length > 0)
    .map((item) => ({ name: item.label.trim(), value: item.amount }));
}

export const salaryStructureService = {
  async update(id: string, patch: SalaryStructurePatch): Promise<SalaryStructure> {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.basic !== undefined) body.baseSalary = patch.basic;
    if (patch.allowances !== undefined) body.allowances = toComponentBody(patch.allowances);
    if (patch.deductions !== undefined) body.deductions = toComponentBody(patch.deductions);
    if (patch.effectiveFrom !== undefined) body.effectiveFrom = patch.effectiveFrom;

    const { data } = await axiosClient.patch<ApiEnvelope<ApiSalaryStructure>>(
      ENDPOINTS.salaryStructures.update(id),
      body,
    );
    return mapSalaryStructure(data.data);
  },
};
