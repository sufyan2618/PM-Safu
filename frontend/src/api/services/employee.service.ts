import { axiosClient, USE_MOCKS } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { delay, paginate } from '../mock/helpers';
import { mockDepartments, mockEmployees, mockSalarySlips } from '../mock/mockData';
import type {
  ApiResponse,
  Department,
  Employee,
  Paginated,
  QueryParams,
  SalarySlip,
} from '@/types';
import type { DepartmentFormValues, EmployeeFormValues } from '@/constants/validation.constants';

interface EmployeeListParams extends QueryParams {
  departmentId?: string;
  status?: string;
}

export const employeeService = {
  async list(params: EmployeeListParams = {}): Promise<Paginated<Employee>> {
    if (USE_MOCKS) {
      let items = mockEmployees;
      if (params.departmentId) items = items.filter((e) => e.departmentId === params.departmentId);
      if (params.status) items = items.filter((e) => e.status === params.status);
      return delay(paginate(items, params, { searchFields: ['name', 'email', 'employeeCode'] }));
    }
    const { data } = await axiosClient.get<ApiResponse<Paginated<Employee>>>(
      ENDPOINTS.employees.list,
      { params },
    );
    return data.data;
  },

  async detail(id: string): Promise<Employee> {
    if (USE_MOCKS) {
      const found = mockEmployees.find((e) => e.id === id);
      if (!found) throw new Error('Employee not found');
      return delay(found);
    }
    const { data } = await axiosClient.get<ApiResponse<Employee>>(ENDPOINTS.employees.detail(id));
    return data.data;
  },

  async salarySlips(id: string): Promise<SalarySlip[]> {
    if (USE_MOCKS) return delay(mockSalarySlips.filter((s) => s.employeeId === id));
    const { data } = await axiosClient.get<ApiResponse<SalarySlip[]>>(
      ENDPOINTS.employees.salarySlips(id),
    );
    return data.data;
  },

  async create(payload: EmployeeFormValues): Promise<Employee> {
    if (USE_MOCKS) {
      return delay({
        id: `emp_${Date.now()}`,
        ...payload,
        departmentName: mockDepartments.find((d) => d.id === payload.departmentId)?.name,
        status: 'active',
        isActive: true,
      } as Employee);
    }
    const { data } = await axiosClient.post<ApiResponse<Employee>>(
      ENDPOINTS.employees.create,
      payload,
    );
    return data.data;
  },

  async update(id: string, payload: Partial<EmployeeFormValues>): Promise<Employee> {
    if (USE_MOCKS) {
      const found = mockEmployees.find((e) => e.id === id)!;
      return delay({ ...found, ...payload });
    }
    const { data } = await axiosClient.patch<ApiResponse<Employee>>(
      ENDPOINTS.employees.update(id),
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.delete(ENDPOINTS.employees.remove(id));
  },
};

export const departmentService = {
  async list(): Promise<Department[]> {
    if (USE_MOCKS) return delay(mockDepartments);
    const { data } = await axiosClient.get<ApiResponse<Department[]>>(ENDPOINTS.departments.list);
    return data.data;
  },

  async create(payload: DepartmentFormValues): Promise<Department> {
    if (USE_MOCKS) {
      return delay({ id: `dep_${Date.now()}`, ...payload, employeeCount: 0 } as Department);
    }
    const { data } = await axiosClient.post<ApiResponse<Department>>(
      ENDPOINTS.departments.create,
      payload,
    );
    return data.data;
  },

  async update(id: string, payload: Partial<DepartmentFormValues>): Promise<Department> {
    if (USE_MOCKS) {
      const found = mockDepartments.find((d) => d.id === id)!;
      return delay({ ...found, ...payload });
    }
    const { data } = await axiosClient.patch<ApiResponse<Department>>(
      ENDPOINTS.departments.update(id),
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await axiosClient.delete(ENDPOINTS.departments.remove(id));
  },
};
