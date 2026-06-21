import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useInvoices } from '@/hooks/queries/useInvoices';
import { useDashboardOverview, usePayrollTrend } from '@/hooks/queries/useDashboard';
import { formatCurrency, formatCompactCurrency } from '@/utils/formatCurrency';
import { ROUTES } from '@/constants/routes.constants';
import { cn } from '@/utils/cn';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-caption font-semibold uppercase tracking-[0.07em] text-ink-400">
      {children}
    </p>
  );
}

export function UrgentActionsRail() {
  const navigate = useNavigate();
  const overdueInvoices = useInvoices({ status: 'overdue', pageSize: 4 });
  const overview = useDashboardOverview();
  const payrollTrend = usePayrollTrend();

  const overdue = overdueInvoices.data?.items ?? [];
  const stats = overview.data;
  const trend = payrollTrend.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Urgent Alerts */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <SectionHeading>Urgent Alerts</SectionHeading>
          {overdue.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-danger-100 text-caption font-bold text-danger-600">
              {overdue.length}
            </span>
          )}
        </div>

        {overdueInvoices.isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : overdue.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-success-100/40 px-3 py-2.5">
            <CheckCircle2 size={14} strokeWidth={2} className="text-success-600" />
            <p className="text-caption text-success-600 font-medium">No overdue invoices</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {overdue.map((inv) => (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.INVOICE_DETAIL(inv.id))}
                  className="group flex w-full items-center gap-2.5 rounded-lg border border-danger-100 bg-danger-100/30 px-3 py-2 text-left transition-colors hover:bg-danger-100/60"
                >
                  <AlertCircle
                    size={13}
                    strokeWidth={2}
                    className="shrink-0 text-danger-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-data text-caption font-semibold text-ink-900">
                      {inv.invoiceNumber}
                    </p>
                    <p className="truncate text-caption text-ink-400">
                      {inv.client?.name ?? 'Unknown client'}
                    </p>
                  </div>
                  <span className="shrink-0 font-data text-caption font-semibold text-danger-600">
                    {formatCurrency(inv.amountDue)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming Payroll */}
      <section>
        <SectionHeading>Upcoming Payroll</SectionHeading>
        {!stats ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 rounded-lg border border-subtle bg-elevated px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-100">
                <span className="h-2 w-2 rounded-full bg-accent-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-ink-900">This month's payroll</p>
                <p className="text-caption text-ink-400">
                  {stats.activeEmployees} employees
                </p>
              </div>
              <span className="shrink-0 font-data text-body-sm font-semibold text-ink-900">
                {formatCompactCurrency(stats.payrollExpenseThisMonth)}
              </span>
            </div>

            {stats.payrollDelta !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2',
                  stats.payrollDelta > 0
                    ? 'bg-warn-100/50 text-warn-600'
                    : 'bg-success-100/50 text-success-600',
                )}
              >
                <Clock size={12} strokeWidth={2} className="shrink-0" />
                <p className="text-caption">
                  {stats.payrollDelta > 0 ? '+' : ''}
                  {stats.payrollDelta}% vs last month
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Payroll Timeline */}
      <section>
        <SectionHeading>Payroll Timeline</SectionHeading>
        {!trend.length ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 rounded-lg" />)}
          </div>
        ) : (
          <ul className="space-y-1">
            {trend.slice(-4).reverse().map((entry, i) => {
              const isLatest = i === 0;
              return (
                <li
                  key={entry.month}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-sunken/60 transition-colors"
                >
                  <div className="flex w-5 shrink-0 items-center justify-center">
                    {isLatest ? (
                      <CheckCircle2 size={14} strokeWidth={2} className="text-accent-600" />
                    ) : (
                      <Minus size={14} strokeWidth={2} className="text-ink-200" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-ink-900">{entry.month}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-data text-body-sm font-semibold text-ink-900">
                      {formatCompactCurrency(entry.amount)}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-caption font-medium',
                        isLatest
                          ? 'bg-accent-100 text-accent-600'
                          : 'bg-sunken text-ink-400',
                      )}
                    >
                      {isLatest ? 'Done' : 'Past'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
