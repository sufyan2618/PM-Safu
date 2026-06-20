import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RevenueChart } from '@/components/domain/dashboard/RevenueChart';
import { PayrollExpenseChart } from '@/components/domain/dashboard/PayrollExpenseChart';
import {
  useDashboardOverview,
  usePayrollTrend,
  useRevenueTrend,
} from '@/hooks/queries/useDashboard';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';

const STATUS_COLORS = ['#0E7C5A', '#3060C2', '#B5780A', '#C2362F'];

export function ReportsPage() {
  const toast = useToast();
  const overview = useDashboardOverview();
  const revenue = useRevenueTrend();
  const payroll = usePayrollTrend();

  const breakdown = overview.data
    ? [
        { name: 'Paid', value: overview.data.invoiceCount.paid },
        { name: 'Sent', value: overview.data.invoiceCount.sent },
        { name: 'Draft', value: overview.data.invoiceCount.draft },
        { name: 'Overdue', value: overview.data.invoiceCount.overdue },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Financial and payroll insights across your company."
        actions={
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={() => toast.success('Report exported')}
          >
            Export report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue vs. expenses" description="Last 8 months" ruled />
          {revenue.isLoading || !revenue.data ? (
            <Skeleton className="h-[260px] rounded-lg" />
          ) : (
            <RevenueChart data={revenue.data} />
          )}
        </Card>

        <Card>
          <CardHeader title="Invoice status" description="By count" ruled />
          {overview.isLoading ? (
            <Skeleton className="h-[260px] rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                >
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle"
                  formatter={(value) => <span className="text-caption text-ink-600">{value}</span>}
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
          <CardHeader title="Key figures" ruled />
          {overview.data && (
            <dl className="space-y-4">
              <Figure label="Total revenue" value={formatCurrency(overview.data.totalRevenue)} />
              <Figure
                label="Outstanding"
                value={formatCurrency(overview.data.outstandingAmount)}
                tone="text-danger-600"
              />
              <Figure
                label="Payroll this month"
                value={formatCurrency(overview.data.payrollExpenseThisMonth)}
              />
              <Figure label="Active employees" value={String(overview.data.activeEmployees)} />
            </dl>
          )}
        </Card>
      </div>
    </>
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
