import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCompany } from '@/hooks/queries/useCompany';
import { companyService } from '@/api/services/company.service';
import { useToast } from '@/hooks/useToast';

interface SlabRow {
  upTo: string;
  rate: string;
}

export function PayrollTaxCard() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: company, isLoading } = useCompany();

  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState('Income Tax');
  const [slabs, setSlabs] = useState<SlabRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ps = company?.payrollSettings;
    if (!ps) return;
    setEnabled(ps.taxEnabled ?? false);
    setLabel(ps.taxDeductionLabel ?? 'Income Tax');
    setSlabs(
      (ps.taxSlabs ?? []).map((s) => ({
        upTo: s.upTo != null ? String(s.upTo) : '',
        rate: String(s.rate),
      })),
    );
  }, [company]);

  function addSlab() {
    setSlabs((s) => [...s, { upTo: '', rate: '' }]);
  }

  function updateSlab(index: number, field: keyof SlabRow, value: string) {
    setSlabs((s) => s.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeSlab(index: number) {
    setSlabs((s) => s.filter((_, i) => i !== index));
  }

  async function save() {
    const parsedSlabs = slabs
      .filter((s) => s.rate.trim() !== '')
      .map((s) => ({
        upTo: s.upTo.trim() === '' ? undefined : Number(s.upTo),
        rate: Number(s.rate),
      }));

    if (enabled && parsedSlabs.some((s) => Number.isNaN(s.rate) || s.rate < 0 || s.rate > 100)) {
      toast.error('Each slab rate must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      await companyService.updatePayrollSettings({
        taxEnabled: enabled,
        taxDeductionLabel: label.trim() || 'Income Tax',
        taxSlabs: parsedSlabs,
      });
      await qc.invalidateQueries({ queryKey: ['company', 'me'] });
      toast.success('Payroll tax settings saved');
    } catch {
      toast.error('Could not save payroll tax settings');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <Skeleton className="h-72 rounded-xl" />;

  return (
    <Card>
      <CardHeader
        title="Payroll tax"
        description="Auto-deduct progressive income tax on taxable earnings during payroll."
        ruled
      />

      <div className="space-y-4">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          label="Enable income tax deduction"
          description="Applied to base salary + taxable allowances each pay run"
        />

        {enabled && (
          <>
            <Input
              label="Deduction label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Income Tax, PAYE, TDS"
            />

            <div>
              <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-600">
                Tax slabs (monthly, progressive)
              </p>
              <div className="space-y-2">
                {slabs.length === 0 && (
                  <p className="text-caption text-ink-400">
                    No slabs yet. Add bands like "up to 50,000 → 5%". Leave the last band's limit
                    empty for the top rate.
                  </p>
                )}
                {slabs.map((slab, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <Input
                      label={i === 0 ? 'Up to (amount)' : undefined}
                      type="number"
                      placeholder="e.g. 50000 (empty = no limit)"
                      value={slab.upTo}
                      onChange={(e) => updateSlab(i, 'upTo', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      label={i === 0 ? 'Rate (%)' : undefined}
                      type="number"
                      step="0.01"
                      placeholder="%"
                      value={slab.rate}
                      onChange={(e) => updateSlab(i, 'rate', e.target.value)}
                      className="w-28"
                    />
                    <IconButton
                      label="Remove slab"
                      icon={<Trash2 size={15} strokeWidth={1.5} />}
                      className="mb-0.5 hover:text-danger-600"
                      onClick={() => removeSlab(i)}
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={15} />}
                className="mt-3"
                onClick={addSlab}
              >
                Add slab
              </Button>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button isLoading={saving} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </Card>
  );
}
