import { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUpdateSalaryStructure } from '@/hooks/queries/useEmployees';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { SalaryComponent, SalaryStructure } from '@/types';

interface SalaryStructureFormProps {
  structure: SalaryStructure;
  employeeId?: string;
}

export function SalaryStructureForm({ structure, employeeId }: SalaryStructureFormProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <SalaryStructureEditor
        structure={structure}
        employeeId={employeeId}
        onClose={() => setEditing(false)}
      />
    );
  }

  const allowanceTotal = structure.allowances.reduce((s, a) => s + a.amount, 0);
  const deductionTotal = structure.deductions.reduce((s, d) => s + d.amount, 0);
  const gross = structure.basic + allowanceTotal;
  const net = gross - deductionTotal;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Pencil size={15} />}
          onClick={() => setEditing(true)}
        >
          Edit structure
        </Button>
      </div>
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
    </>
  );
}

function SalaryStructureEditor({
  structure,
  employeeId,
  onClose,
}: {
  structure: SalaryStructure;
  employeeId?: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const update = useUpdateSalaryStructure(employeeId);
  const [basic, setBasic] = useState(structure.basic);
  const [allowances, setAllowances] = useState<SalaryComponent[]>(structure.allowances);
  const [deductions, setDeductions] = useState<SalaryComponent[]>(structure.deductions);
  const [effectiveFrom, setEffectiveFrom] = useState(structure.effectiveFrom.slice(0, 10));

  const allowanceTotal = allowances.reduce((s, a) => s + (a.amount || 0), 0);
  const deductionTotal = deductions.reduce((s, d) => s + (d.amount || 0), 0);
  const net = basic + allowanceTotal - deductionTotal;

  async function handleSave() {
    try {
      await update.mutateAsync({
        id: structure.id,
        patch: { basic, allowances, deductions, effectiveFrom },
      });
      toast.success('Salary structure updated');
      onClose();
    } catch {
      toast.error('Could not update salary structure');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Basic salary"
          type="number"
          isMono
          value={Number.isNaN(basic) ? '' : basic}
          onChange={(e) => setBasic(Number(e.target.value))}
        />
        <Input
          label="Effective from"
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
        />
      </div>

      <ComponentEditor
        title="Allowances"
        items={allowances}
        onChange={setAllowances}
        addLabel="Add allowance"
      />
      <ComponentEditor
        title="Deductions"
        items={deductions}
        onChange={setDeductions}
        addLabel="Add deduction"
      />

      <div className="flex items-center justify-between rounded-lg bg-accent-100 px-4 py-3">
        <span className="text-body-sm font-medium text-accent-600">Net pay</span>
        <span className="font-data text-heading font-semibold text-accent-600">
          {formatCurrency(net)}
        </span>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button isLoading={update.isPending} onClick={handleSave}>
          Save structure
        </Button>
      </div>
    </div>
  );
}

function ComponentEditor({
  title,
  items,
  onChange,
  addLabel,
}: {
  title: string;
  items: SalaryComponent[];
  onChange: (items: SalaryComponent[]) => void;
  addLabel: string;
}) {
  function updateItem(index: number, patch: Partial<SalaryComponent>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <h4 className="mb-3 text-caption font-semibold uppercase tracking-[0.04em] text-ink-400">
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Label"
                value={item.label}
                onChange={(e) => updateItem(index, { label: e.target.value })}
              />
            </div>
            <div className="w-40">
              <Input
                type="number"
                isMono
                placeholder="0"
                value={Number.isNaN(item.amount) ? '' : item.amount}
                onChange={(e) => updateItem(index, { amount: Number(e.target.value) })}
              />
            </div>
            <button
              type="button"
              aria-label="Remove"
              onClick={() => removeItem(index)}
              className="shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-sunken hover:text-danger-600"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-caption text-ink-400">No {title.toLowerCase()} added.</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Plus size={15} />}
        className="mt-2"
        onClick={() => onChange([...items, { label: '', amount: 0 }])}
      >
        {addLabel}
      </Button>
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
