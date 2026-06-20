import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import type { InvoiceTemplate } from '@/types';

interface InvoiceTemplateCardProps {
  template: InvoiceTemplate;
  selected: boolean;
  onSelect: () => void;
}

export function InvoiceTemplateCard({ template, selected, onSelect }: InvoiceTemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-surface text-left transition-all',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600',
        selected ? 'border-accent-600 ring-1 ring-accent-600' : 'border-subtle hover:border-strong',
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-accent-600 text-white">
          <Check size={14} strokeWidth={2.5} />
        </span>
      )}
      {/* Miniature invoice mock */}
      <div className="aspect-[1.3] w-full bg-white p-4">
        <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: template.accentColor }} />
        <div className="mt-3 flex justify-between">
          <div className="h-6 w-6 rounded" style={{ backgroundColor: template.accentColor }} />
          <div className="space-y-1 text-right">
            <div className="ml-auto h-2 w-12 rounded-full bg-[#0E1320]/80" />
            <div className="ml-auto h-1.5 w-8 rounded-full bg-[#CBD2DC]" />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          {[100, 80, 90, 70].map((w, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-1.5 rounded-full bg-[#E4E7EC]" style={{ width: `${w / 2}%` }} />
              <div className="h-1.5 w-8 rounded-full bg-[#E4E7EC]" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <div className="h-2 w-14 rounded-full" style={{ backgroundColor: template.accentColor }} />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-subtle px-4 py-3">
        <div>
          <p className="text-body-sm font-medium text-ink-900">{template.name}</p>
          <p className="text-caption capitalize text-ink-400">{template.layout} layout</p>
        </div>
        {template.isDefault && (
          <Badge tone="accent" size="sm">
            Default
          </Badge>
        )}
      </div>
    </button>
  );
}
