import { Badge } from '@/components/ui/Badge';
import {
  EMPLOYEE_STATUS_MAP,
  INVOICE_STATUS_MAP,
  PAYROLL_STATUS_MAP,
  SLIP_STATUS_MAP,
} from '@/constants/status.constants';
import type { InvoiceStatus } from '@/types/invoice.types';
import type { PayrollStatus } from '@/types/payroll.types';
import type { EmployeeStatus } from '@/types/employee.types';
import type { SalarySlipPaymentStatus } from '@/types/salarySlip.types';

type Kind = 'invoice' | 'payroll' | 'employee' | 'slip';

interface StatusPillProps {
  kind: Kind;
  status: InvoiceStatus | PayrollStatus | EmployeeStatus | SalarySlipPaymentStatus;
  size?: 'sm' | 'md';
}

const MAPS = {
  invoice: INVOICE_STATUS_MAP,
  payroll: PAYROLL_STATUS_MAP,
  employee: EMPLOYEE_STATUS_MAP,
  slip: SLIP_STATUS_MAP,
} as const;

export function StatusPill({ kind, status, size = 'sm' }: StatusPillProps) {
  const map = MAPS[kind] as Record<string, { label: string; tone: never }>;
  const meta = map[status] ?? { label: status, tone: 'neutral' };
  return (
    <Badge tone={meta.tone} dot outlined size={size}>
      {meta.label}
    </Badge>
  );
}
