import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatCurrency';

interface PayrollSummaryCardProps {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}

export function PayrollSummaryCard({
  totalGross,
  totalDeductions,
  totalNet,
  employeeCount,
}: PayrollSummaryCardProps) {
  const items = [
    { label: 'Employees', value: String(employeeCount), tone: 'text-ink-900' },
    { label: 'Gross', value: formatCurrency(totalGross), tone: 'text-ink-900' },
    { label: 'Deductions', value: formatCurrency(totalDeductions), tone: 'text-danger-600' },
    { label: 'Net payout', value: formatCurrency(totalNet), tone: 'text-accent-600' },
  ];
  return (
    <Card>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item, i) => (
          <div key={item.label} className={i < 3 ? 'lg:border-r lg:border-subtle' : ''}>
            <dt className="text-caption uppercase tracking-[0.02em] text-ink-400">{item.label}</dt>
            <dd className={`mt-1 font-data text-heading font-medium ${item.tone}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
