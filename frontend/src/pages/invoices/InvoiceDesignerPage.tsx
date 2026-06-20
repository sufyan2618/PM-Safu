import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { InvoiceTemplateCard } from '@/components/domain/invoices/InvoiceTemplateCard';
import { InvoicePreviewPane } from '@/components/domain/invoices/InvoicePreviewPane';
import { useInvoiceTemplates } from '@/hooks/queries/useInvoices';
import { useToast } from '@/hooks/useToast';
import type { InvoiceTemplate } from '@/types';

const SAMPLE_ITEMS = [
  { description: 'Brand identity design', quantity: 1, unitPrice: 3200, taxRate: 8 },
  { description: 'Website development', quantity: 1, unitPrice: 5400, taxRate: 8 },
];

export function InvoiceDesignerPage() {
  const { data: templates, isLoading } = useInvoiceTemplates();
  const toast = useToast();
  const [active, setActive] = useState<InvoiceTemplate | null>(null);

  useEffect(() => {
    if (templates && !active) setActive(templates.find((t) => t.isDefault) ?? templates[0]);
  }, [templates, active]);

  return (
    <>
      <PageHeader
        title="Invoice designer"
        description="Brand your invoices — colors, layout and logo apply everywhere."
        actions={
          <Button onClick={() => toast.success('Template saved')}>Save template</Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Templates" ruled />
            {isLoading || !templates ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[1.3] rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <InvoiceTemplateCard
                    key={template.id}
                    template={template}
                    selected={active?.id === template.id}
                    onSelect={() => setActive(template)}
                  />
                ))}
              </div>
            )}
          </Card>

          {active && (
            <Card>
              <CardHeader title="Customize" ruled />
              <div className="space-y-4">
                <Input
                  label="Template name"
                  value={active.name}
                  onChange={(e) => setActive({ ...active, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <ColorField
                    label="Accent color"
                    value={active.accentColor}
                    onChange={(accentColor) => setActive({ ...active, accentColor })}
                  />
                  <ColorField
                    label="Primary color"
                    value={active.primaryColor}
                    onChange={(primaryColor) => setActive({ ...active, primaryColor })}
                  />
                </div>
                <Select
                  label="Layout"
                  value={active.layout}
                  onChange={(v) => setActive({ ...active, layout: v as InvoiceTemplate['layout'] })}
                  options={[
                    { label: 'Classic', value: 'classic' },
                    { label: 'Modern', value: 'modern' },
                    { label: 'Minimal', value: 'minimal' },
                  ]}
                />
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center gap-1.5 text-caption text-ink-400">
            <Palette size={13} strokeWidth={1.5} /> Live preview
          </div>
          <InvoicePreviewPane
            invoiceNumber="INV-1042"
            issueDate={new Date().toISOString()}
            dueDate={new Date(Date.now() + 14 * 86400000).toISOString()}
            lineItems={SAMPLE_ITEMS}
            notes="Thank you for your business."
            template={active}
          />
        </div>
      </div>
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-caption font-medium uppercase tracking-[0.02em] text-ink-600">
        {label}
      </label>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-strong bg-surface px-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <span className="font-data text-body-sm uppercase text-ink-600">{value}</span>
      </div>
    </div>
  );
}
