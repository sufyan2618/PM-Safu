import type { BadgeTone } from '@/components/ui/Badge/Badge.types';
import type { InvoiceStatus } from '@/types/invoice.types';
import type { PayrollStatus } from '@/types/payroll.types';
import type { EmployeeStatus } from '@/types/employee.types';
import type { SalarySlipPaymentStatus } from '@/types/salarySlip.types';

interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

export const INVOICE_STATUS_MAP: Record<InvoiceStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  partially_paid: { label: 'Partially Paid', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const PAYROLL_STATUS_MAP: Record<PayrollStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'neutral' },
  processing: { label: 'Processing', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const EMPLOYEE_STATUS_MAP: Record<EmployeeStatus, StatusMeta> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  terminated: { label: 'Terminated', tone: 'danger' },
};

export const SLIP_STATUS_MAP: Record<SalarySlipPaymentStatus, StatusMeta> = {
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
};
