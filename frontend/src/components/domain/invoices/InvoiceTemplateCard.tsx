import { Check, Copy, Star, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import type { InvoiceTemplate } from '@/types';

interface InvoiceTemplateCardProps {
  template: InvoiceTemplate;
  selected: boolean;
  onSelect: () => void;
  onClone?: () => void;
  onSetDefault?: () => void;
  onDelete?: () => void;
}

export function InvoiceTemplateCard({
  template,
  selected,
  onSelect,
  onClone,
  onSetDefault,
  onDelete,
}: InvoiceTemplateCardProps) {
  const primary = template.design.branding.primaryColor;
  const accent = template.design.branding.accentColor;
  const headerStyle = template.design.layout.headerStyle;
  const isBanner = headerStyle === 'logo-top-banner';

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'relative w-full overflow-hidden rounded-xl border bg-surface text-left transition-all',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600',
          selected ? 'border-accent-600 ring-1 ring-accent-600' : 'border-subtle hover:border-strong',
        )}
      >
        {selected && (
          <span className="absolute right-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-white shadow-sm">
            <Check size={11} strokeWidth={2.5} />
          </span>
        )}

        {/* Miniature invoice mock */}
        <div className="aspect-[1.3] w-full overflow-hidden bg-white">
          {/* Header strip */}
          {isBanner ? (
            <div className="h-5 w-full" style={{ backgroundColor: primary }} />
          ) : (
            <div className="h-1 w-full" style={{ backgroundColor: primary }} />
          )}

          <div className="px-3 pt-2 pb-1">
            {/* Logo + company / Invoice label */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-4 w-4 rounded-sm"
                  style={{ backgroundColor: accent }}
                />
                <div className="h-1.5 w-10 rounded-full bg-[#0E1320]/60" />
              </div>
              <div className="space-y-0.5 text-right">
                <div className="ml-auto h-1.5 w-7 rounded-full" style={{ backgroundColor: primary }} />
                <div className="ml-auto h-1 w-5 rounded-full bg-[#CBD2DC]" />
              </div>
            </div>

            {/* Client / dates row */}
            <div className="mt-2 flex justify-between">
              <div className="space-y-1">
                <div className="h-1 w-8 rounded-full bg-[#E4E7EC]" />
                <div className="h-1.5 w-12 rounded-full bg-[#0E1320]/40" />
              </div>
              <div className="space-y-1 text-right">
                <div className="ml-auto h-1 w-10 rounded-full bg-[#E4E7EC]" />
                <div className="ml-auto h-1 w-8 rounded-full bg-[#E4E7EC]" />
              </div>
            </div>

            {/* Table rows */}
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: `${accent}22` }} />
              {[100, 75, 85, 60].map((w, i) => (
                <div key={i} className="flex items-center justify-between gap-1">
                  <div
                    className="h-1 rounded-full bg-[#E4E7EC]"
                    style={{ width: `${w / 2.5}%` }}
                  />
                  <div className="h-1 w-5 rounded-full bg-[#E4E7EC]" />
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-2 flex justify-end">
              <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: primary }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-subtle px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-body-sm font-medium text-ink-900">{template.name}</p>
            <p className="text-caption capitalize text-ink-400">{template.baseTheme} theme</p>
          </div>
          {template.isDefault && (
            <Badge tone="accent" size="sm">
              Default
            </Badge>
          )}
        </div>
      </button>

      {/* Action buttons (shown on hover) */}
      {(onClone || onSetDefault || onDelete) && (
        <div className="absolute right-2 top-2 hidden flex-col gap-1 group-hover:flex">
          {onSetDefault && !template.isDefault && (
            <button
              type="button"
              title="Set as default"
              onClick={(e) => { e.stopPropagation(); onSetDefault(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/90 shadow-sm hover:bg-accent-100 hover:text-accent-600 border border-subtle backdrop-blur-sm transition-colors"
            >
              <Star size={13} strokeWidth={1.5} />
            </button>
          )}
          {onClone && (
            <button
              type="button"
              title="Duplicate"
              onClick={(e) => { e.stopPropagation(); onClone(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/90 shadow-sm hover:bg-sunken border border-subtle backdrop-blur-sm transition-colors"
            >
              <Copy size={13} strokeWidth={1.5} />
            </button>
          )}
          {onDelete && !template.isDefault && (
            <button
              type="button"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/90 shadow-sm hover:bg-danger-50 hover:text-danger-600 border border-subtle backdrop-blur-sm transition-colors"
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
