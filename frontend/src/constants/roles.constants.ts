import type { Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  company_admin: 'Administrator',
  hr_manager: 'HR Manager',
  accountant: 'Accountant',
  staff: 'Staff',
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  company_admin: ['*'],
  hr_manager: ['employees.*', 'departments.*', 'payroll.*', 'reports.read'],
  accountant: ['invoices.*', 'clients.*', 'templates.*', 'dashboard.read'],
  staff: ['salarySlips.read.self', 'profile.update.self'],
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((role) => ({
  label: ROLE_LABELS[role],
  value: role,
}));
