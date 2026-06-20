import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard, StaffHomeRedirect } from './RoleGuard';
import { OnboardingGuard, OnboardingRedirect } from './OnboardingGuard';
import { AppShell } from '@/components/layout/AppShell';
import { RouteFallback } from './RouteFallback';
import { ROUTES } from '@/constants/routes.constants';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const OnboardingPage = lazy(() =>
  import('@/pages/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const InvoiceListPage = lazy(() =>
  import('@/pages/invoices/InvoiceListPage').then((m) => ({ default: m.InvoiceListPage })),
);
const InvoiceCreatePage = lazy(() =>
  import('@/pages/invoices/InvoiceCreatePage').then((m) => ({ default: m.InvoiceCreatePage })),
);
const InvoiceDetailPage = lazy(() =>
  import('@/pages/invoices/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })),
);
const InvoiceDesignerPage = lazy(() =>
  import('@/pages/invoices/InvoiceDesignerPage').then((m) => ({ default: m.InvoiceDesignerPage })),
);
const InvoiceShareViewPage = lazy(() =>
  import('@/pages/invoices/InvoiceShareViewPage').then((m) => ({ default: m.InvoiceShareViewPage })),
);
const ClientListPage = lazy(() =>
  import('@/pages/clients/ClientListPage').then((m) => ({ default: m.ClientListPage })),
);
const ClientDetailPage = lazy(() =>
  import('@/pages/clients/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })),
);
const EmployeeListPage = lazy(() =>
  import('@/pages/employees/EmployeeListPage').then((m) => ({ default: m.EmployeeListPage })),
);
const EmployeeDetailPage = lazy(() =>
  import('@/pages/employees/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })),
);
const DepartmentsPage = lazy(() =>
  import('@/pages/employees/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })),
);
const PayrollRunListPage = lazy(() =>
  import('@/pages/payroll/PayrollRunListPage').then((m) => ({ default: m.PayrollRunListPage })),
);
const PayrollRunProcessPage = lazy(() =>
  import('@/pages/payroll/PayrollRunProcessPage').then((m) => ({
    default: m.PayrollRunProcessPage,
  })),
);
const PayrollRunDetailPage = lazy(() =>
  import('@/pages/payroll/PayrollRunDetailPage').then((m) => ({
    default: m.PayrollRunDetailPage,
  })),
);
const SalarySlipListPage = lazy(() =>
  import('@/pages/salarySlips/SalarySlipListPage').then((m) => ({ default: m.SalarySlipListPage })),
);
const SalarySlipDetailPage = lazy(() =>
  import('@/pages/salarySlips/SalarySlipDetailPage').then((m) => ({
    default: m.SalarySlipDetailPage,
  })),
);
const ReportsPage = lazy(() =>
  import('@/pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const ProfileSettingsPage = lazy(() =>
  import('@/pages/settings/ProfileSettingsPage').then((m) => ({ default: m.ProfileSettingsPage })),
);
const CompanySettingsPage = lazy(() =>
  import('@/pages/settings/CompanySettingsPage').then((m) => ({ default: m.CompanySettingsPage })),
);
const UsersAndRolesPage = lazy(() =>
  import('@/pages/settings/UsersAndRolesPage').then((m) => ({ default: m.UsersAndRolesPage })),
);
const BillingSettingsPage = lazy(() =>
  import('@/pages/settings/BillingSettingsPage').then((m) => ({ default: m.BillingSettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/misc/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const UnauthorizedPage = lazy(() =>
  import('@/pages/misc/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
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
            {/* Company onboarding (no shell) */}
            <Route element={<OnboardingRedirect />}>
              <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
            </Route>

            {/* Main app — requires a fully onboarded company */}
            <Route element={<OnboardingGuard />}>
              <Route element={<AppShell />}>
                <Route element={<StaffHomeRedirect />}>
                  <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                </Route>

                <Route element={<RoleGuard allow={['company_admin', 'accountant']} />}>
                  <Route path={ROUTES.INVOICES} element={<InvoiceListPage />} />
                  <Route path={ROUTES.INVOICE_CREATE} element={<InvoiceCreatePage />} />
                  <Route path={ROUTES.INVOICE_DESIGNER} element={<InvoiceDesignerPage />} />
                  <Route path={ROUTES.INVOICE_EDIT()} element={<InvoiceCreatePage />} />
                  <Route path={ROUTES.INVOICE_DETAIL()} element={<InvoiceDetailPage />} />

                  <Route path={ROUTES.CLIENTS} element={<ClientListPage />} />
                  <Route path={ROUTES.CLIENT_DETAIL()} element={<ClientDetailPage />} />
                </Route>

                <Route element={<RoleGuard allow={['company_admin', 'hr_manager']} />}>
                  <Route path={ROUTES.DEPARTMENTS} element={<DepartmentsPage />} />
                  <Route path={ROUTES.EMPLOYEES} element={<EmployeeListPage />} />
                  <Route path={ROUTES.EMPLOYEE_DETAIL()} element={<EmployeeDetailPage />} />
                  <Route path={ROUTES.PAYROLL_RUNS} element={<PayrollRunListPage />} />
                  <Route path={ROUTES.PAYROLL_NEW} element={<PayrollRunProcessPage />} />
                  <Route path={ROUTES.PAYROLL_PROCESS()} element={<PayrollRunProcessPage />} />
                  <Route path={ROUTES.PAYROLL_DETAIL()} element={<PayrollRunDetailPage />} />
                </Route>

                <Route element={<RoleGuard allow={['company_admin', 'hr_manager', 'accountant']} />}>
                  <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
                </Route>

                <Route path={ROUTES.SALARY_SLIPS} element={<SalarySlipListPage />} />
                <Route path={ROUTES.SALARY_SLIP_DETAIL()} element={<SalarySlipDetailPage />} />

                <Route path={ROUTES.SETTINGS_PROFILE} element={<ProfileSettingsPage />} />
                <Route element={<RoleGuard allow={['company_admin']} />}>
                  <Route path={ROUTES.SETTINGS_COMPANY} element={<CompanySettingsPage />} />
                  <Route path={ROUTES.SETTINGS_USERS} element={<UsersAndRolesPage />} />
                  <Route path={ROUTES.SETTINGS_BILLING} element={<BillingSettingsPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
