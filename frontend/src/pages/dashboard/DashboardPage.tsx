import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  FileWarning,
  Users,
  Wallet,
  Plus,
  Download,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { StatTile } from '@/components/domain/dashboard/StatTile';
import { RevenueChart } from '@/components/domain/dashboard/RevenueChart';
import { UrgentActionsRail } from '@/components/domain/dashboard/UrgentActionsRail';
import { CashFlowForecast } from '@/components/domain/dashboard/CashFlowForecast';
import {
  useDashboardOverview,
  useRevenueTrend,
} from '@/hooks/queries/useDashboard';
import { useInvoices } from '@/hooks/queries/useInvoices';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';

function OperationalHeader() {
  const navigate = useNavigate();
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-0.5 text-caption font-semibold uppercase tracking-[0.08em] text-ink-400">
          {dateLabel}
        </p>
        <h1 className="text-display-lg text-ink-900">Cash Flow Overview</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Download size={14} />}
          onClick={() => navigate(ROUTES.REPORTS)}
        >
          Export Report
        </Button>
        <Button
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => navigate(ROUTES.INVOICE_CREATE)}
        >
          Create Invoice
        </Button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const overview = useDashboardOverview();
  const revenue = useRevenueTrend();
  const recentInvoices = useInvoices({ pageSize: 6 });

  const stats = overview.data;

  // Build a simple sparkline from revenue trend for the "collected" tile
  const revSparkline = revenue.data?.map((d) => d.revenue);
  const expSparkline = revenue.data?.map((d) => d.expense);

  return (
    <>
      <OperationalHeader />

      {/* KPI Strip — hero (2/5) + 3 supporting (3/5) */}
      <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-5">
        {/* Hero tile */}
        <div className="xl:col-span-2">
          {overview.isLoading || !stats ? (
            <Skeleton className="h-[140px] rounded-xl" />
          ) : (
            <StatTile
              label="Collected this month"
              value={formatCompactCurrency(stats.totalRevenue)}
              icon={Banknote}
              tone="accent"
              variant="hero"
              delta={{
                value: `${Math.abs(stats.revenueDelta)}%`,
                trend: stats.revenueDelta >= 0 ? 'up' : 'down',
              }}
              hint="vs. last month"
              sparkline={revSparkline}
            />
          )}
        </div>

        {/* 3 supporting tiles */}
        <div className="grid grid-cols-3 gap-3 xl:col-span-3">
          {overview.isLoading || !stats ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[140px] rounded-xl" />
            ))
          ) : (
            <>
              <StatTile
                label="Overdue"
                value={formatCompactCurrency(stats.outstandingAmount)}
                icon={FileWarning}
                tone="danger"
                hint={`${stats.overdueCount} invoice${stats.overdueCount === 1 ? '' : 's'}`}
              />
              <StatTile
                label="Payroll"
                value={formatCompactCurrency(stats.payrollExpenseThisMonth)}
                icon={Wallet}
                tone="warning"
                delta={{
                  value: `${Math.abs(stats.payrollDelta)}%`,
                  trend: stats.payrollDelta <= 0 ? 'up' : 'down',
                }}
                hint="vs. last month"
              />
              <StatTile
                label="Employees"
                value={String(stats.activeEmployees)}
                icon={Users}
                tone="info"
                hint={
                  stats.newHiresThisMonth > 0
                    ? `+${stats.newHiresThisMonth} new`
                    : `${stats.departmentCount} dept${stats.departmentCount === 1 ? '' : 's'}`
                }
              />
            </>
          )}
        </div>
      </div>



      {/* Main asymmetric grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Large cashflow chart — takes 2/3 */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Cashflow"
            description="Revenue vs. expense"
            ruled
          />
          {revenue.isLoading || !revenue.data ? (
            <Skeleton className="h-[280px] rounded-lg" />
          ) : (
            <RevenueChart data={revenue.data} />
          )}
        </Card>

        {/* Urgent actions rail — takes 1/3 */}
        <Card className="xl:col-span-1">
          <UrgentActionsRail />
        </Card>
      </div>

            {/* Cash Flow Forecast */}
      <div className="mt-4">
        <CashFlowForecast />
      </div>

      {/* Recent Invoices */}
      <div className="mt-4">
        <Card>
          <CardHeader
            title="Recent Invoices"
            ruled
            action={
              <button
                type="button"
                onClick={() => navigate(ROUTES.INVOICES)}
                className="flex items-center gap-1 text-caption font-semibold text-accent-600 transition-colors hover:text-accent-500"
              >
                View all
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>
            }
          />
          {recentInvoices.isLoading || !recentInvoices.data ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : recentInvoices.data.items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-body-sm text-ink-400">No invoices yet.</p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.INVOICE_CREATE)}
                className="mt-2 text-body-sm font-medium text-accent-600 hover:text-accent-500"
              >
                Create your first invoice →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="pb-2.5 text-left text-caption font-semibold uppercase tracking-[0.06em] text-ink-400">
                      Invoice
                    </th>
                    <th className="pb-2.5 text-left text-caption font-semibold uppercase tracking-[0.06em] text-ink-400">
                      Client
                    </th>
                    <th className="hidden pb-2.5 text-left text-caption font-semibold uppercase tracking-[0.06em] text-ink-400 sm:table-cell">
                      Due date
                    </th>
                    <th className="pb-2.5 text-left text-caption font-semibold uppercase tracking-[0.06em] text-ink-400">
                      Status
                    </th>
                    <th className="pb-2.5 text-right text-caption font-semibold uppercase tracking-[0.06em] text-ink-400">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-faint">
                  {recentInvoices.data.items.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() => navigate(ROUTES.INVOICE_DETAIL(invoice.id))}
                      className="cursor-pointer transition-colors hover:bg-sunken/40"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-data text-body-sm font-semibold text-ink-900">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-body-sm text-ink-900">{invoice.client?.name}</p>
                      </td>
                      <td className="hidden py-3 pr-4 sm:table-cell">
                        <span className="text-body-sm text-ink-400">
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill kind="invoice" status={invoice.status} />
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-data text-body-sm font-semibold text-ink-900">
                          {formatCurrency(invoice.total)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
