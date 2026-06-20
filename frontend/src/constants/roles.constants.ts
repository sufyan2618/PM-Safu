import type { Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  company_admin: 'Administrator',
  hr_manager: 'HR Manager',
  accountant: 'Accountant',
  staff: 'Staff',
};

/**
 * Documentation / UI matrix of what each role can do. Enforcement lives in the
 * backend `requireRole` middleware and the frontend route/nav guards; this map
 * mirrors that final model for display purposes.
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  company_admin: ['*'],
  hr_manager: [
    'dashboard.read',
    'employees.*',
    'departments.*',
    'salaryStructures.*',
    'payroll.*',
    'salarySlips.*',
    'reports.read',
  ],
  accountant: [
    'dashboard.read',
    'invoices.*',
    'clients.*',
    'templates.*',
    'reports.read',
  ],
  // Self-service portal user: can only see their own profile and payslips.
  staff: ['profile.read.self', 'profile.update.self', 'salarySlips.read.self'],
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((role) => ({
  label: ROLE_LABELS[role],
  value: role,
}));
