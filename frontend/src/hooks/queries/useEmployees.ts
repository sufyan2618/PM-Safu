import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  departmentService,
  employeeService,
  type DepartmentUpdatePayload,
} from '@/api/services/employee.service';
import {
  salaryStructureService,
  type SalaryStructurePatch,
} from '@/api/services/salaryStructure.service';
import type { QueryParams } from '@/types';
import type { DepartmentFormValues, EmployeeFormValues } from '@/constants/validation.constants';

interface EmployeeListParams extends QueryParams {
  departmentId?: string;
  status?: string;
}

export function useEmployees(params: EmployeeListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeeService.list(params),
    enabled,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.detail(id!),
    enabled: !!id,
  });
}

export function useEmployeeSlips(id: string | undefined) {
  return useQuery({
    queryKey: ['employee', id, 'slips'],
    queryFn: () => employeeService.salarySlips(id!),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeeFormValues) => employeeService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EmployeeFormValues>) => employeeService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.remove(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}

export function useUpdateSalaryStructure(employeeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: SalaryStructurePatch }) =>
      salaryStructureService.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      if (employeeId) qc.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}

export function useDepartments() {
  return useQuery({ queryKey: ['departments'], queryFn: departmentService.list });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartmentFormValues) => departmentService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: DepartmentUpdatePayload }) =>
      departmentService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}
