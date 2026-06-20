import type { Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  accountant: 'Accountant',
  employee: 'Employee',
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  manager: ['invoices.*', 'employees.*', 'payroll.read', 'reports.read'],
  accountant: ['invoices.*', 'payroll.*', 'reports.*'],
  employee: ['salarySlips.read.self', 'profile.update.self'],
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((role) => ({
  label: ROLE_LABELS[role],
  value: role,
}));
