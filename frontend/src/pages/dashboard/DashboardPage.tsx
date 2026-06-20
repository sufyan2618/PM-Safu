import { useNavigate } from 'react-router-dom';
import { Banknote, FileWarning, Users, Wallet, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { StatTile } from '@/components/domain/dashboard/StatTile';
import { RevenueChart } from '@/components/domain/dashboard/RevenueChart';
import { PayrollExpenseChart } from '@/components/domain/dashboard/PayrollExpenseChart';
import { OutstandingPaymentsList } from '@/components/domain/dashboard/OutstandingPaymentsList';
import {
  useDashboardOverview,
  useOutstandingClients,
  usePayrollTrend,
  useRevenueTrend,
} from '@/hooks/queries/useDashboard';
import { useInvoices } from '@/hooks/queries/useInvoices';
import { useAuthStore } from '@/store/authStore';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';

export function DashboardPage() {
  const navigate = useNavigate();
  const userName = useAuthStore((s) => s.user?.name?.split(' ')[0]);
  const overview = useDashboardOverview();
  const revenue = useRevenueTrend();
  const payroll = usePayrollTrend();
  const outstanding = useOutstandingClients();
  const recentInvoices = useInvoices({ pageSize: 5 });

  const stats = overview.data;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${userName ?? 'there'}`}
        description="Here's what's happening across billing and payroll today."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate(ROUTES.INVOICE_CREATE)}>
            New invoice
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-xl" />)
        ) : (
          <>
            <StatTile
              label="Total revenue"
              value={formatCompactCurrency(stats.totalRevenue)}
              icon={Banknote}
              tone="accent"
              delta={{ value: '12.4%', trend: 'up' }}
              hint="vs. last quarter"
            />
            <StatTile
              label="Outstanding"
              value={formatCompactCurrency(stats.outstandingAmount)}
              icon={FileWarning}
              tone="danger"
              delta={{ value: '3.1%', trend: 'down' }}
              hint={`${stats.invoiceCount.overdue} overdue`}
            />
            <StatTile
              label="Payroll this month"
              value={formatCompactCurrency(stats.payrollExpenseThisMonth)}
              icon={Wallet}
              tone="info"
              hint="Next run in 6 days"
            />
            <StatTile
              label="Active employees"
              value={String(stats.activeEmployees)}
              icon={Users}
              tone="warning"
              hint="Across 5 departments"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue vs. expenses" description="Last 8 months" ruled />
          {revenue.isLoading || !revenue.data ? (
            <Skeleton className="h-[260px] rounded-lg" />
          ) : (
            <RevenueChart data={revenue.data} />
          )}
        </Card>

        <Card>
          <CardHeader title="Outstanding payments" description="Top clients by balance" ruled />
          {outstanding.isLoading || !outstanding.data ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <OutstandingPaymentsList clients={outstanding.data} />
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Payroll expense" description="Last 6 months" ruled />
          {payroll.isLoading || !payroll.data ? (
            <Skeleton className="h-[260px] rounded-lg" />
          ) : (
            <PayrollExpenseChart data={payroll.data} />
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent invoices"
            ruled
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.INVOICES)}>
                View all
              </Button>
            }
          />
          {recentInvoices.isLoading || !recentInvoices.data ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-subtle">
              {recentInvoices.data.items.map((invoice) => (
                <li
                  key={invoice.id}
                  onClick={() => navigate(ROUTES.INVOICE_DETAIL(invoice.id))}
                  className="flex cursor-pointer items-center gap-3 py-3 transition-colors hover:bg-sunken/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-data text-body-sm font-medium text-ink-900">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="truncate text-caption text-ink-400">{invoice.client?.name}</p>
                  </div>
                  <span className="hidden text-caption text-ink-400 sm:block">
                    {formatDate(invoice.dueDate)}
                  </span>
                  <StatusPill kind="invoice" status={invoice.status} />
                  <span className="w-24 text-right font-data text-body-sm font-medium text-ink-900">
                    {formatCurrency(invoice.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
