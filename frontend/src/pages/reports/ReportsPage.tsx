import { useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker/DatePicker';
import { Skeleton } from '@/components/ui/Skeleton';
import { RevenueChart } from '@/components/domain/dashboard/RevenueChart';
import { PayrollExpenseChart } from '@/components/domain/dashboard/PayrollExpenseChart';
import {
  useFinancialSummary,
  usePayrollTrend,
  useRevenueTrend,
} from '@/hooks/queries/useDashboard';
import { dashboardService } from '@/api/services/dashboard.service';
import { useToast } from '@/hooks/useToast';
import { exportCsv } from '@/utils/exportCsv';
import { formatCurrency } from '@/utils/formatCurrency';
import type { InvoiceStatusBreakdown } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  paid: '#0E7C5A',
  sent: '#3060C2',
  partially_paid: '#7C5CFC',
  draft: '#6B7280',
  overdue: '#C2362F',
  cancelled: '#9CA3AF',
};

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return { from: toInputDate(from), to: toInputDate(now) };
}

export function ReportsPage() {
  const toast = useToast();
  const [range, setRange] = useState(defaultRange);
  const [exporting, setExporting] = useState(false);

  const summary = useFinancialSummary(range);
  const revenue = useRevenueTrend();
  const payroll = usePayrollTrend();

  const breakdown = summary.data?.invoiceStatusBreakdown ?? [];

  const pieData = useMemo(
    () =>
      breakdown
        .filter((b) => b.amount > 0)
        .map((b) => ({
          name: formatStatus(b.status),
          value: b.amount,
          status: b.status,
        })),
    [breakdown],
  );

  function handleExportCsv() {
    if (!summary.data) return;
    const rows: InvoiceStatusBreakdown[] = summary.data.invoiceStatusBreakdown;
    exportCsv(
      rows,
      [
        { header: 'Status', accessor: (r) => formatStatus(r.status) },
        { header: 'Invoices', accessor: (r) => r.count },
        { header: 'Total Amount', accessor: (r) => r.amount },
        { header: 'Amount Due', accessor: (r) => r.amountDue },
      ],
      `financial-report-${range.from}-to-${range.to}`,
    );
    toast.success('CSV exported');
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      await dashboardService.downloadReportPdf(
        range,
        `financial-report-${range.from}-to-${range.to}.pdf`,
      );
    } catch {
      toast.error('Could not export PDF');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Financial and payroll insights across your company."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Download size={16} />}
              onClick={handleExportCsv}
              disabled={!summary.data}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              leftIcon={<FileText size={16} />}
              onClick={handleExportPdf}
              isLoading={exporting}
              disabled={!summary.data}
            >
              Export PDF
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-48">
            <DatePicker
              label="From"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div className="w-full sm:w-48">
            <DatePicker
              label="To"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </div>
          <p className="text-caption text-ink-400 sm:ml-2 sm:pb-2.5">
            Figures, the breakdown and exports below reflect this period.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.isLoading || !summary.data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <SummaryTile label="Revenue" value={formatCurrency(summary.data.revenue)} tone="text-accent-700" />
            <SummaryTile
              label="Payroll expense"
              value={formatCurrency(summary.data.payrollExpense)}
            />
            <SummaryTile
              label="Net"
              value={formatCurrency(summary.data.net)}
              tone={summary.data.net >= 0 ? 'text-accent-700' : 'text-danger-600'}
            />
            <SummaryTile
              label="Outstanding"
              value={formatCurrency(summary.data.outstanding)}
              tone="text-danger-600"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue vs. expenses" description="Last 8 months" ruled />
          {revenue.isLoading || !revenue.data ? (
            <Skeleton className="h-[260px] rounded-lg" />
          ) : (
            <RevenueChart data={revenue.data} />
          )}
        </Card>

        <Card>
          <CardHeader title="Invoice value" description="By status, selected period" ruled />
          {summary.isLoading ? (
            <Skeleton className="h-[260px] rounded-lg" />
          ) : pieData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-body-sm text-ink-400">
              No invoices in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend
                  iconType="circle"
                  formatter={(value: string) => (
                    <span className="text-caption text-ink-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Payroll expense" description="Last 6 months" ruled />
          {payroll.isLoading || !payroll.data ? (
            <Skeleton className="h-[260px] rounded-lg" />
          ) : (
            <PayrollExpenseChart data={payroll.data} />
          )}
        </Card>

        <Card>
          <CardHeader title="Payroll summary" description="Selected period" ruled />
          {summary.data ? (
            <dl className="space-y-4">
              <Figure label="Gross" value={formatCurrency(summary.data.payroll.gross)} />
              <Figure
                label="Deductions"
                value={formatCurrency(summary.data.payroll.deductions)}
                tone="text-danger-600"
              />
              <Figure label="Net paid" value={formatCurrency(summary.data.payroll.net)} />
            </dl>
          ) : (
            <Skeleton className="h-32 rounded-lg" />
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Invoice status breakdown" description="Selected period" ruled />
        {summary.data ? (
          breakdown.length === 0 ? (
            <p className="py-6 text-center text-body-sm text-ink-400">No invoices in this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-subtle text-left text-caption uppercase tracking-[0.04em] text-ink-500">
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Invoices</th>
                    <th className="py-2 text-right font-medium">Total amount</th>
                    <th className="py-2 text-right font-medium">Amount due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {breakdown.map((row) => (
                    <tr key={row.status}>
                      <td className="py-2.5">{formatStatus(row.status)}</td>
                      <td className="py-2.5 text-right font-data">{row.count}</td>
                      <td className="py-2.5 text-right font-data">{formatCurrency(row.amount)}</td>
                      <td className="py-2.5 text-right font-data text-danger-600">
                        {formatCurrency(row.amountDue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <Skeleton className="h-32 rounded-lg" />
        )}
      </Card>
    </>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card padded={false} className="p-4">
      <p className="text-caption uppercase tracking-[0.04em] text-ink-500">{label}</p>
      <p className={`mt-1 font-data text-display-sm font-semibold ${tone ?? 'text-ink-900'}`}>
        {value}
      </p>
    </Card>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-subtle pb-3 last:border-0 last:pb-0">
      <dt className="text-body-sm text-ink-600">{label}</dt>
      <dd className={`font-data text-body font-medium ${tone ?? 'text-ink-900'}`}>{value}</dd>
    </div>
  );
}
