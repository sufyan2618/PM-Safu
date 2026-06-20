export interface Department {
  id: string;
  name: string;
  description?: string;
  headEmployeeId?: string;
  headEmployeeName?: string;
  employeeCount: number;
}

export interface SalaryComponent {
  label: string;
  amount: number;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  basic: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  effectiveFrom: string;
}

export type EmploymentType = 'full_time' | 'part_time' | 'contract';
export type EmployeeStatus = 'active' | 'inactive' | 'terminated';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  departmentId: string;
  departmentName?: string;
  designation: string;
  employmentType: EmploymentType;
  joinDate: string;
  status: EmployeeStatus;
  isActive: boolean;
  salaryStructure?: SalaryStructure;
}
