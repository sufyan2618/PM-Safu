import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { SalaryStructure } from '@/types';

export function SalaryStructureForm({ structure }: { structure: SalaryStructure }) {
  const allowanceTotal = structure.allowances.reduce((s, a) => s + a.amount, 0);
  const deductionTotal = structure.deductions.reduce((s, d) => s + d.amount, 0);
  const gross = structure.basic + allowanceTotal;
  const net = gross - deductionTotal;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <h4 className="mb-3 text-caption font-semibold uppercase tracking-[0.04em] text-ink-400">
          Earnings
        </h4>
        <dl className="space-y-2 text-body-sm">
          <Row label="Basic salary" value={formatCurrency(structure.basic)} />
          {structure.allowances.map((a) => (
            <Row key={a.label} label={a.label} value={formatCurrency(a.amount)} />
          ))}
          <div className="ledger-rule pt-2" />
          <Row label="Gross salary" value={formatCurrency(gross)} strong />
        </dl>
      </div>

      <div>
        <h4 className="mb-3 text-caption font-semibold uppercase tracking-[0.04em] text-ink-400">
          Deductions
        </h4>
        <dl className="space-y-2 text-body-sm">
          {structure.deductions.map((d) => (
            <Row key={d.label} label={d.label} value={formatCurrency(d.amount)} negative />
          ))}
          <div className="ledger-rule pt-2" />
          <Row label="Total deductions" value={formatCurrency(deductionTotal)} strong negative />
        </dl>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-accent-100 px-4 py-3">
          <span className="text-body-sm font-medium text-accent-600">Net pay</span>
          <span className="font-data text-heading font-semibold text-accent-600">
            {formatCurrency(net)}
          </span>
        </div>
        <p className="mt-3 text-caption text-ink-400">
          Effective from {formatDate(structure.effectiveFrom)}
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? 'font-medium text-ink-900' : 'text-ink-600'}>{label}</dt>
      <dd
        className={`font-data ${strong ? 'font-medium text-ink-900' : 'text-ink-900'} ${
          negative ? 'text-danger-600' : ''
        }`}
      >
        {negative ? '−' : ''}
        {value}
      </dd>
    </div>
  );
}
