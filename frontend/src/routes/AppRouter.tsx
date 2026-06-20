import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { ROUTES } from '@/constants/routes.constants';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { InvoiceListPage } from '@/pages/invoices/InvoiceListPage';
import { InvoiceCreatePage } from '@/pages/invoices/InvoiceCreatePage';
import { InvoiceDetailPage } from '@/pages/invoices/InvoiceDetailPage';
import { InvoiceDesignerPage } from '@/pages/invoices/InvoiceDesignerPage';
import { InvoiceShareViewPage } from '@/pages/invoices/InvoiceShareViewPage';
import { ClientListPage } from '@/pages/clients/ClientListPage';
import { ClientDetailPage } from '@/pages/clients/ClientDetailPage';
import { EmployeeListPage } from '@/pages/employees/EmployeeListPage';
import { EmployeeDetailPage } from '@/pages/employees/EmployeeDetailPage';
import { DepartmentsPage } from '@/pages/employees/DepartmentsPage';
import { PayrollRunListPage } from '@/pages/payroll/PayrollRunListPage';
import { PayrollRunProcessPage } from '@/pages/payroll/PayrollRunProcessPage';
import { SalarySlipListPage } from '@/pages/salarySlips/SalarySlipListPage';
import { SalarySlipDetailPage } from '@/pages/salarySlips/SalarySlipDetailPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { ProfileSettingsPage } from '@/pages/settings/ProfileSettingsPage';
import { CompanySettingsPage } from '@/pages/settings/CompanySettingsPage';
import { UsersAndRolesPage } from '@/pages/settings/UsersAndRolesPage';
import { BillingSettingsPage } from '@/pages/settings/BillingSettingsPage';
import { NotFoundPage } from '@/pages/misc/NotFoundPage';
import { UnauthorizedPage } from '@/pages/misc/UnauthorizedPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        {/* Public share view (no shell, no auth) */}
        <Route path={ROUTES.INVOICE_SHARE()} element={<InvoiceShareViewPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        {/* Authenticated app */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

            <Route path={ROUTES.INVOICES} element={<InvoiceListPage />} />
            <Route path={ROUTES.INVOICE_CREATE} element={<InvoiceCreatePage />} />
            <Route path={ROUTES.INVOICE_DESIGNER} element={<InvoiceDesignerPage />} />
            <Route path={ROUTES.INVOICE_EDIT()} element={<InvoiceCreatePage />} />
            <Route path={ROUTES.INVOICE_DETAIL()} element={<InvoiceDetailPage />} />

            <Route path={ROUTES.CLIENTS} element={<ClientListPage />} />
            <Route path={ROUTES.CLIENT_DETAIL()} element={<ClientDetailPage />} />

            <Route element={<RoleGuard allow={['admin', 'manager']} />}>
              <Route path={ROUTES.DEPARTMENTS} element={<DepartmentsPage />} />
              <Route path={ROUTES.EMPLOYEES} element={<EmployeeListPage />} />
              <Route path={ROUTES.EMPLOYEE_DETAIL()} element={<EmployeeDetailPage />} />
            </Route>

            <Route element={<RoleGuard allow={['admin', 'manager', 'accountant']} />}>
              <Route path={ROUTES.PAYROLL_RUNS} element={<PayrollRunListPage />} />
              <Route path={ROUTES.PAYROLL_NEW} element={<PayrollRunProcessPage />} />
              <Route path={ROUTES.PAYROLL_PROCESS()} element={<PayrollRunProcessPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            </Route>

            <Route path={ROUTES.SALARY_SLIPS} element={<SalarySlipListPage />} />
            <Route path={ROUTES.SALARY_SLIP_DETAIL()} element={<SalarySlipDetailPage />} />

            <Route path={ROUTES.SETTINGS_PROFILE} element={<ProfileSettingsPage />} />
            <Route element={<RoleGuard allow={['admin']} />}>
              <Route path={ROUTES.SETTINGS_COMPANY} element={<CompanySettingsPage />} />
              <Route path={ROUTES.SETTINGS_USERS} element={<UsersAndRolesPage />} />
              <Route path={ROUTES.SETTINGS_BILLING} element={<BillingSettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
        <Route path="/404" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
