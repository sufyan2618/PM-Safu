import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { mapDepartment, mapEmployee, mapSalarySlip, toPaginated } from '../mappers';
import { toQuery } from '../query';
import type { ApiDepartment, ApiEmployee, ApiSalarySlip } from '../dto';
import type {
  ApiEnvelope,
  Department,
  Employee,
  EmployeeStatus,
  Paginated,
  QueryParams,
  SalarySlip,
} from '@/types';
import type { DepartmentFormValues, EmployeeFormValues } from '@/constants/validation.constants';

interface EmployeeListParams extends QueryParams {
  departmentId?: string;
  status?: EmployeeStatus | string;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? name;
  return { firstName, lastName: parts.join(' ') || firstName };
}

function toEmployeeBody(payload: Partial<EmployeeFormValues>) {
  const body: Record<string, unknown> = {
    email: payload.email,
    phone: payload.phone,
    departmentId: payload.departmentId,
    designation: payload.designation,
    employmentType: payload.employmentType,
    dateOfJoining: payload.joinDate,
    employeeCode: payload.employeeCode || undefined,
  };
  if (payload.name) {
    Object.assign(body, splitName(payload.name));
  }
  if (payload.baseSalary != null) {
    body.salaryStructure = {
      name: payload.name ? `${payload.name} structure` : 'Salary structure',
      baseSalary: payload.baseSalary,
      effectiveFrom: payload.joinDate,
    };
  }
  return body;
}

export const employeeService = {
  async list(params: EmployeeListParams = {}): Promise<Paginated<Employee>> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiEmployee[]>>(ENDPOINTS.employees.list, {
      params: toQuery(params),
    });
    return toPaginated(data, mapEmployee);
  },

  async detail(id: string): Promise<Employee> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiEmployee>>(ENDPOINTS.employees.detail(id));
    return mapEmployee(data.data);
  },

  async salarySlips(id: string): Promise<SalarySlip[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiSalarySlip[]>>(
      ENDPOINTS.employees.salarySlips(id),
    );
    return data.data.map(mapSalarySlip);
  },

  async create(payload: EmployeeFormValues): Promise<Employee> {
    const { data } = await axiosClient.post<ApiEnvelope<ApiEmployee>>(
      ENDPOINTS.employees.create,
      toEmployeeBody(payload),
    );
    return mapEmployee(data.data);
  },

  async update(id: string, payload: Partial<EmployeeFormValues>): Promise<Employee> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiEmployee>>(
      ENDPOINTS.employees.update(id),
      toEmployeeBody(payload),
    );
    return mapEmployee(data.data);
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.employees.remove(id));
  },
};

export const departmentService = {
  async list(): Promise<Department[]> {
    const { data } = await axiosClient.get<ApiEnvelope<ApiDepartment[]>>(ENDPOINTS.departments.list);
    return data.data.map(mapDepartment);
  },

  async create(payload: DepartmentFormValues): Promise<Department> {
    const { data } = await axiosClient.post<ApiEnvelope<ApiDepartment>>(
      ENDPOINTS.departments.create,
      payload,
    );
    return mapDepartment(data.data);
  },

  async update(id: string, payload: Partial<DepartmentFormValues>): Promise<Department> {
    const { data } = await axiosClient.patch<ApiEnvelope<ApiDepartment>>(
      ENDPOINTS.departments.update(id),
      payload,
    );
    return mapDepartment(data.data);
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.departments.remove(id));
  },
};
