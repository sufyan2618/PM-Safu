export const ENDPOINTS = {
  auth: {
    superAdminLogin: '/auth/super-admin/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  superAdmin: {
    dashboard: '/super-admin/dashboard',
    companies: '/super-admin/companies',
    company: (id: string) => `/super-admin/companies/${id}`,
    companyUsers: (id: string) => `/super-admin/companies/${id}/users`,
    approve: (id: string) => `/super-admin/companies/${id}/approve`,
    reject: (id: string) => `/super-admin/companies/${id}/reject`,
    suspend: (id: string) => `/super-admin/companies/${id}/suspend`,
    reactivate: (id: string) => `/super-admin/companies/${id}/reactivate`,
  },
} as const;
