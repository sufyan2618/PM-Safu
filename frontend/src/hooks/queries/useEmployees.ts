import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentService, employeeService } from '@/api/services/employee.service';
import type { QueryParams } from '@/types';
import type { DepartmentFormValues, EmployeeFormValues } from '@/constants/validation.constants';

interface EmployeeListParams extends QueryParams {
  departmentId?: string;
  status?: string;
}

export function useEmployees(params: EmployeeListParams = {}) {
  return useQuery({ queryKey: ['employees', params], queryFn: () => employeeService.list(params) });
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
