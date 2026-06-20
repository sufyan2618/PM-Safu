export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',

  ONBOARDING: '/onboarding',

  DASHBOARD: '/',

  INVOICES: '/invoices',
  INVOICE_CREATE: '/invoices/new',
  INVOICE_DETAIL: (id = ':id') => `/invoices/${id}`,
  INVOICE_EDIT: (id = ':id') => `/invoices/${id}/edit`,
  INVOICE_DESIGNER: '/invoices/designer',
  INVOICE_SHARE: (token = ':token') => `/invoice/share/${token}`,

  CLIENTS: '/clients',
  CLIENT_DETAIL: (id = ':id') => `/clients/${id}`,

  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: (id = ':id') => `/employees/${id}`,
  DEPARTMENTS: '/employees/departments',

  PAYROLL_RUNS: '/payroll',
  PAYROLL_DETAIL: (id = ':id') => `/payroll/${id}`,
  PAYROLL_PROCESS: (id = ':id') => `/payroll/${id}/process`,
  PAYROLL_NEW: '/payroll/new/process',

  SALARY_SLIPS: '/salary-slips',
  SALARY_SLIP_DETAIL: (id = ':id') => `/salary-slips/${id}`,

  REPORTS: '/reports',

  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_COMPANY: '/settings/company',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_BILLING: '/settings/billing',

  UNAUTHORIZED: '/unauthorized',
} as const;
