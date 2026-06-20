import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  FileText,
  Users,
  Palette,
  IdCard,
  Building2,
  Building,
  Wallet,
  ReceiptText,
  BarChart3,
  UserCircle,
  ShieldCheck,
  CreditCard,
  ScrollText,
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

const NON_STAFF: Role[] = ['company_admin', 'hr_manager', 'accountant'];

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutGrid, path: ROUTES.DASHBOARD, roles: NON_STAFF }],
  },
  {
    label: 'My Workspace',
    items: [
      { label: 'My Payslips', icon: ReceiptText, path: ROUTES.SALARY_SLIPS, roles: ['staff'] },
      { label: 'My Profile', icon: UserCircle, path: ROUTES.SETTINGS_PROFILE, roles: ['staff'] },
    ],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Invoices', icon: FileText, path: ROUTES.INVOICES, roles: ['company_admin', 'accountant'] },
      { label: 'Clients', icon: Users, path: ROUTES.CLIENTS, roles: ['company_admin', 'accountant'] },
      {
        label: 'Invoice Designer',
        icon: Palette,
        path: ROUTES.INVOICE_DESIGNER,
        roles: ['company_admin', 'accountant'],
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        label: 'Employees',
        icon: IdCard,
        path: ROUTES.EMPLOYEES,
        roles: ['company_admin', 'hr_manager'],
      },
      {
        label: 'Departments',
        icon: Building2,
        path: ROUTES.DEPARTMENTS,
        roles: ['company_admin', 'hr_manager'],
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
        roles: ['company_admin', 'hr_manager'],
      },
      { label: 'Salary Slips', icon: ReceiptText, path: ROUTES.SALARY_SLIPS, roles: NON_STAFF },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Reports',
        icon: BarChart3,
        path: ROUTES.REPORTS,
        roles: ['company_admin', 'hr_manager', 'accountant'],
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Profile', icon: UserCircle, path: ROUTES.SETTINGS_PROFILE, roles: NON_STAFF },
      { label: 'Company', icon: Building, path: ROUTES.SETTINGS_COMPANY, roles: ['company_admin'] },
      {
        label: 'Users & Roles',
        icon: ShieldCheck,
        path: ROUTES.SETTINGS_USERS,
        roles: ['company_admin'],
      },
      {
        label: 'Audit Log',
        icon: ScrollText,
        path: ROUTES.SETTINGS_AUDIT_LOG,
        roles: ['company_admin'],
      },
      { label: 'Billing', icon: CreditCard, path: ROUTES.SETTINGS_BILLING, roles: ['company_admin'] },
    ],
  },
];
