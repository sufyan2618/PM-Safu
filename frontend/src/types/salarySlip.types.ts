import type { Employee, SalaryComponent } from './employee.types';

export type SalarySlipPaymentStatus = 'pending' | 'paid';

export interface SalarySlip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employee?: Employee;
  period: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  paymentStatus: SalarySlipPaymentStatus;
  paidOn?: string;
  pdfUrl?: string;
}
