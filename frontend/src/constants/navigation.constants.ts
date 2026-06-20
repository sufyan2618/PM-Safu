import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  FileText,
  Users,
  Palette,
  IdCard,
  Building2,
  Wallet,
  ReceiptText,
  BarChart3,
} from 'lucide-react';
import { ROUTES } from './routes.constants';
import type { Role } from '@/types';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Roles allowed to see this item; omitted = all roles. */
  roles?: Role[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutGrid, path: ROUTES.DASHBOARD }],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Invoices', icon: FileText, path: ROUTES.INVOICES },
      { label: 'Clients', icon: Users, path: ROUTES.CLIENTS },
      { label: 'Invoice Designer', icon: Palette, path: ROUTES.INVOICE_DESIGNER },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Employees', icon: IdCard, path: ROUTES.EMPLOYEES, roles: ['admin', 'manager'] },
      {
        label: 'Departments',
        icon: Building2,
        path: ROUTES.DEPARTMENTS,
        roles: ['admin', 'manager'],
      },
    ],
  },
  {
    label: 'Payroll',
    items: [
      {
        label: 'Payroll Runs',
        icon: Wallet,
        path: ROUTES.PAYROLL_RUNS,
        roles: ['admin', 'manager', 'accountant'],
      },
      { label: 'Salary Slips', icon: ReceiptText, path: ROUTES.SALARY_SLIPS },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Reports',
        icon: BarChart3,
        path: ROUTES.REPORTS,
        roles: ['admin', 'manager', 'accountant'],
      },
    ],
  },
];
