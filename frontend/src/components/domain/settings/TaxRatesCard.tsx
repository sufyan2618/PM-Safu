import { useState } from 'react';
import { Pencil, Plus, Trash2, Percent } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useCreateTaxRate,
  useDeleteTaxRate,
  useTaxRates,
  useUpdateTaxRate,
} from '@/hooks/queries/useTaxRates';
import { useToast } from '@/hooks/useToast';
import type { TaxRate } from '@/types';

interface FormState {
  name: string;
  rate: string;
  description: string;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = { name: '', rate: '', description: '', isDefault: false };

export function TaxRatesCard() {
  const toast = useToast();
  const { data: taxRates, isLoading } = useTaxRates();
  const createTaxRate = useCreateTaxRate();
  const updateTaxRate = useUpdateTaxRate();
  const deleteTaxRate = useDeleteTaxRate();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<TaxRate | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(taxRate: TaxRate) {
    setEditing(taxRate);
    setForm({
      name: taxRate.name,
      rate: String(taxRate.rate),
      description: taxRate.description ?? '',
      isDefault: taxRate.isDefault,
    });
    setFormOpen(true);
  }

  async function onSubmit() {
    const rate = Number(form.rate);
    if (!form.name.trim()) {
      toast.error('Tax name is required');
      return;
    }
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Rate must be between 0 and 100');
      return;
    }
    const payload = {
      name: form.name.trim(),
      rate,
      description: form.description.trim() || undefined,
      isDefault: form.isDefault,
    };
    try {
      if (editing) {
        await updateTaxRate.mutateAsync({ id: editing.id, payload });
        toast.success('Tax rate updated');
      } else {
        await createTaxRate.mutateAsync(payload);
        toast.success('Tax rate created');
      }
      setFormOpen(false);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error('Could not save tax rate', message ?? 'Please try again.');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTaxRate.mutateAsync(deleting.id);
      toast.success('Tax rate deleted');
      setDeleting(null);
    } catch {
      toast.error('Could not delete tax rate');
    }
  }

  return (
    <Card>
      <CardHeader
        title="Tax rates"
        description="Reusable rates you can apply to invoice line items."
        ruled
        action={
          <Button variant="ghost" size="sm" leftIcon={<Plus size={15} />} onClick={openCreate}>
            Add
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : !taxRates || taxRates.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="No tax rates yet"
          description="Create a rate like 'VAT 20%' to reuse across invoices."
        />
      ) : (
        <ul className="divide-y divide-subtle">
          {taxRates.map((taxRate) => (
            <li key={taxRate.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-body-sm font-medium text-ink-900">{taxRate.name}</p>
                  {taxRate.isDefault && (
                    <Badge tone="accent" size="sm">
                      Default
                    </Badge>
                  )}
                </div>
                {taxRate.description && (
                  <p className="truncate text-caption text-ink-400">{taxRate.description}</p>
                )}
              </div>
              <span className="font-data text-body-sm font-medium text-ink-900">{taxRate.rate}%</span>
              <IconButton
                size="sm"
                label="Edit tax rate"
                icon={<Pencil size={15} strokeWidth={1.5} />}
                onClick={() => openEdit(taxRate)}
              />
              <IconButton
                size="sm"
                label="Delete tax rate"
                icon={<Trash2 size={15} strokeWidth={1.5} />}
                className="hover:text-danger-600"
                onClick={() => setDeleting(taxRate)}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit tax rate' : 'New tax rate'}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              isLoading={createTaxRate.isPending || updateTaxRate.isPending}
              onClick={onSubmit}
            >
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. VAT"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Rate (%)"
            type="number"
            step="0.01"
            placeholder="e.g. 20"
            value={form.rate}
            onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
          />
          <Input
            label="Description"
            placeholder="Optional"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Switch
            checked={form.isDefault}
            onChange={(checked) => setForm((f) => ({ ...f, isDefault: checked }))}
            label="Set as default"
            description="Pre-selected when adding invoice lines"
          />
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete tax rate"
        description={
          deleting ? `Are you sure you want to delete "${deleting.name}"?` : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteTaxRate.isPending}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink-600">
          Existing invoices keep their tax values; this only removes the reusable rate.
        </p>
      </Modal>
    </Card>
  );
}
