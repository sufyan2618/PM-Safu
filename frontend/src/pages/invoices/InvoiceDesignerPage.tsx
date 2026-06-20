import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, ImagePlus, Palette, Plus, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { InvoiceTemplateCard } from '@/components/domain/invoices/InvoiceTemplateCard';
import { InvoicePreviewPane } from '@/components/domain/invoices/InvoicePreviewPane';
import {
  useInvoiceTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useCloneTemplate,
  useSetDefaultTemplate,
  useDeleteTemplate,
} from '@/hooks/queries/useInvoices';
import { invoiceService } from '@/api/services/invoice.service';
import { companyService } from '@/api/services/company.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type {
  InvoiceDesign,
  InvoiceLayout,
  InvoiceTemplate,
  FontFamily,
  HeaderStyle,
} from '@/types';

// ── Sample data for the live preview ────────────────────────────────────────
const SAMPLE_ITEMS = [
  { description: 'Brand identity design', quantity: 1, unitPrice: 3200, taxRate: 8 },
  { description: 'Website development', quantity: 1, unitPrice: 5400, taxRate: 8 },
  { description: 'Monthly retainer', quantity: 3, unitPrice: 800, taxRate: 5 },
];
const SAMPLE_ISSUE_DATE = new Date().toISOString();
const SAMPLE_DUE_DATE = new Date(Date.now() + 14 * 86400000).toISOString();

// ── Color presets ────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { name: 'Blue Pro', primary: '#2563EB', secondary: '#1E293B', accent: '#0EA5E9' },
  { name: 'Green Finance', primary: '#059669', secondary: '#064E3B', accent: '#10B981' },
  { name: 'Purple Modern', primary: '#7C3AED', secondary: '#2E1065', accent: '#A78BFA' },
  { name: 'Orange Startup', primary: '#EA580C', secondary: '#1C1917', accent: '#FB923C' },
  { name: 'Red Corporate', primary: '#DC2626', secondary: '#1C1917', accent: '#F87171' },
  { name: 'Teal Clean', primary: '#0D9488', secondary: '#134E4A', accent: '#2DD4BF' },
];

// ── Font options ─────────────────────────────────────────────────────────────
const FONT_OPTIONS: { label: string; value: FontFamily }[] = [
  { label: 'Inter (Sans-serif)', value: 'Inter' },
  { label: 'Poppins (Geometric)', value: 'Poppins' },
  { label: 'Roboto (Clean)', value: 'Roboto' },
  { label: 'Lato (Modern)', value: 'Lato' },
  { label: 'Merriweather (Serif)', value: 'Merriweather' },
];

// ── Theme cards ──────────────────────────────────────────────────────────────
const THEME_OPTIONS: { label: string; value: InvoiceLayout; desc: string }[] = [
  { label: 'Classic', value: 'classic', desc: 'Serif · Structured' },
  { label: 'Modern', value: 'modern', desc: 'Banner header · Bold' },
  { label: 'Minimal', value: 'minimal', desc: 'Black & white · Clean' },
  { label: 'Bold', value: 'bold', desc: 'High contrast · Impact' },
  { label: 'Custom', value: 'custom', desc: 'Your own style' },
];

const HEADER_STYLE_OPTIONS: { label: string; value: HeaderStyle }[] = [
  { label: 'Logo left', value: 'logo-left' },
  { label: 'Logo center', value: 'logo-center' },
  { label: 'Logo right', value: 'logo-right' },
  { label: 'Full banner', value: 'logo-top-banner' },
];

type DesignerTab = 'branding' | 'layout' | 'typography' | 'sections' | 'advanced';

const DESIGNER_TABS: { label: string; value: DesignerTab }[] = [
  { label: 'Branding', value: 'branding' },
  { label: 'Layout', value: 'layout' },
  { label: 'Typography', value: 'typography' },
  { label: 'Sections', value: 'sections' },
  { label: 'Advanced', value: 'advanced' },
];

// ── Section display config ───────────────────────────────────────────────────
const SECTION_KEYS = [
  'companyInfo', 'clientInfo', 'invoiceMeta', 'itemsTable',
  'summary', 'notes', 'terms', 'paymentInstructions', 'signature', 'footer',
] as const;

type SectionKey = typeof SECTION_KEYS[number];

// Sections whose order can be rearranged in the preview's lower content area.
const REORDERABLE_KEYS = ['notes', 'terms', 'paymentInstructions', 'signature', 'footer'] as const;
type ReorderableKey = typeof REORDERABLE_KEYS[number];
const isReorderable = (key: SectionKey): key is ReorderableKey =>
  (REORDERABLE_KEYS as readonly string[]).includes(key);

const SECTION_LABELS: Record<SectionKey, string> = {
  companyInfo: 'Company Info',
  clientInfo: 'Client / Bill To',
  invoiceMeta: 'Invoice Details',
  itemsTable: 'Items Table',
  summary: 'Totals Summary',
  notes: 'Notes',
  terms: 'Terms & Conditions',
  paymentInstructions: 'Payment Instructions',
  signature: 'Signature',
  footer: 'Footer',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
        {label}
      </label>
      <div className="flex h-10 items-center gap-2.5 rounded-lg border border-strong bg-surface px-2.5 transition-colors hover:border-ink-400">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <span className="font-mono text-[11px] uppercase text-ink-500">{value}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function InvoiceDesignerPage() {
  const { data: templates, isLoading } = useInvoiceTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const cloneTemplate = useCloneTemplate();
  const setDefaultTemplate = useSetDefaultTemplate();
  const deleteTemplate = useDeleteTemplate();
  const toast = useToast();
  const company = useAuthStore((s) => s.company);
  const setCompany = useAuthStore((s) => s.setCompany);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [localDesign, setLocalDesign] = useState<InvoiceDesign | null>(null);
  const [localName, setLocalName] = useState('');
  const [activeTab, setActiveTab] = useState<DesignerTab>('branding');
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const activeTemplate = templates?.find((t) => t.id === activeId) ?? null;

  // Initialise to the default template on first load
  useEffect(() => {
    if (templates && templates.length > 0 && !activeId) {
      const def = templates.find((t) => t.isDefault) ?? templates[0];
      setActiveId(def.id);
      setLocalDesign(deepClone(def.design));
      setLocalName(def.name);
    }
  }, [templates]);

  function selectTemplate(t: InvoiceTemplate) {
    setActiveId(t.id);
    setLocalDesign(deepClone(t.design));
    setLocalName(t.name);
  }

  const previewTemplate: InvoiceTemplate | null =
    activeTemplate && localDesign
      ? { ...activeTemplate, name: localName, design: localDesign }
      : activeTemplate;

  // ── Patchdesign helpers ──────────────────────────────────────────────────
  function patchBranding(patch: Partial<InvoiceDesign['branding']>) {
    setLocalDesign((d) => d && { ...d, branding: { ...d.branding, ...patch } });
  }
  function patchLayout(patch: Partial<InvoiceDesign['layout']>) {
    setLocalDesign((d) => d && { ...d, layout: { ...d.layout, ...patch } });
  }
  function patchTypography(patch: Partial<InvoiceDesign['typography']>) {
    setLocalDesign((d) => d && { ...d, typography: { ...d.typography, ...patch } });
  }
  function patchWatermark(patch: Partial<InvoiceDesign['watermark']>) {
    setLocalDesign((d) => d && { ...d, watermark: { ...d.watermark, ...patch } });
  }
  function patchSectionVisibility(key: SectionKey, visible: boolean) {
    setLocalDesign((d) => {
      if (!d) return d;
      return {
        ...d,
        sections: { ...d.sections, [key]: { ...d.sections[key], visible } },
      };
    });
  }
  function patchSectionLabel(key: 'clientInfo' | 'notes' | 'terms', label: string) {
    setLocalDesign((d) => {
      if (!d) return d;
      return {
        ...d,
        sections: { ...d.sections, [key]: { ...d.sections[key], label } },
      };
    });
  }
  function moveSectionOrder(key: ReorderableKey, direction: 'up' | 'down') {
    setLocalDesign((d) => {
      if (!d) return d;
      // Reorder only within the reorderable content group, sorted by current order.
      const group = [...REORDERABLE_KEYS].sort(
        (a, b) => d.sections[a].order - d.sections[b].order,
      );
      const idx = group.indexOf(key);
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= group.length) return d;
      const swapKey = group[targetIdx];
      const a = d.sections[key].order;
      const b = d.sections[swapKey].order;
      return {
        ...d,
        sections: {
          ...d.sections,
          [key]: { ...d.sections[key], order: b },
          [swapKey]: { ...d.sections[swapKey], order: a },
        },
      };
    });
  }

  // ── Logo upload for template branding override ───────────────────────────
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const result = await companyService.uploadLogo(file);
      patchBranding({ logoUrl: result.logoUrl });
      setCompany({ ...company!, logoUrl: result.logoUrl });
      toast.success('Logo updated');
    } catch {
      toast.error('Upload failed');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!activeId || !localDesign) return;
    setSaving(true);
    try {
      await updateTemplate.mutateAsync({
        id: activeId,
        patch: { name: localName, design: localDesign },
      });
      toast.success('Template saved');
    } catch {
      toast.error('Could not save template');
    } finally {
      setSaving(false);
    }
  }

  // ── Preview PDF in new tab ───────────────────────────────────────────────
  async function handlePreviewPdf() {
    if (!localDesign) return;
    try {
      const html = await invoiceService.previewDesign(localDesign);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch {
      toast.error('Could not load preview');
    }
  }

  // ── Create new template ──────────────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const created = await createTemplate.mutateAsync({
        name: newName.trim(),
        baseTheme: 'custom',
        design: localDesign ?? (templates?.[0]?.design as InvoiceDesign),
      });
      selectTemplate(created);
      setCreatingNew(false);
      setNewName('');
      toast.success('Template created');
    } catch {
      toast.error('Could not create template');
    }
  }

  // ── Clone ────────────────────────────────────────────────────────────────
  async function handleClone(id: string, name: string) {
    try {
      const cloned = await cloneTemplate.mutateAsync({ id, name: `${name} (Copy)` });
      selectTemplate(cloned);
      toast.success('Template duplicated');
    } catch {
      toast.error('Could not duplicate template');
    }
  }

  // ── Set default ──────────────────────────────────────────────────────────
  async function handleSetDefault(id: string) {
    try {
      await setDefaultTemplate.mutateAsync(id);
      toast.success('Default template updated');
    } catch {
      toast.error('Could not update default');
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(t: InvoiceTemplate) {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await deleteTemplate.mutateAsync(t.id);
      // If the deleted template was active, switch to first remaining
      if (activeId === t.id && templates) {
        const next = templates.find((x) => x.id !== t.id);
        if (next) selectTemplate(next);
        else setActiveId(null);
      }
      toast.success('Template deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Cannot delete this template');
    }
  }

  // ── Apply color preset ───────────────────────────────────────────────────
  function applyPreset(preset: (typeof COLOR_PRESETS)[number]) {
    patchBranding({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
  }

  // ── Sorted section keys ───────────────────────────────────────────────────
  const sortedSections = localDesign
    ? [...SECTION_KEYS].sort(
        (a, b) => localDesign.sections[a].order - localDesign.sections[b].order,
      )
    : SECTION_KEYS;

  // Content blocks that can be reordered in the preview, sorted by current order.
  const reorderGroup = localDesign
    ? [...REORDERABLE_KEYS].sort(
        (a, b) => localDesign.sections[a].order - localDesign.sections[b].order,
      )
    : [...REORDERABLE_KEYS];

  return (
    <>
      <PageHeader
        title="Invoice Designer"
        description="Customise colors, layout and content — changes preview instantly."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<ExternalLink size={15} />} onClick={handlePreviewPdf} disabled={!localDesign}>
              PDF Preview
            </Button>
            <Button
              leftIcon={<Save size={15} />}
              onClick={handleSave}
              isLoading={saving}
              disabled={!activeId || !localDesign}
            >
              Save template
            </Button>
          </div>
        }
      />

      {/* ── Template gallery ─────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] w-[140px] shrink-0 rounded-xl" />
            ))
          ) : (
            <>
              {(templates ?? []).map((t) => (
                <div key={t.id} className="w-[140px] shrink-0">
                  <InvoiceTemplateCard
                    template={t}
                    selected={activeId === t.id}
                    onSelect={() => selectTemplate(t)}
                    onClone={() => handleClone(t.id, t.name)}
                    onSetDefault={() => handleSetDefault(t.id)}
                    onDelete={() => handleDelete(t)}
                  />
                </div>
              ))}

              {/* New template button */}
              {creatingNew ? (
                <div className="flex w-[160px] shrink-0 flex-col gap-2 rounded-xl border border-subtle bg-surface p-3">
                  <Input
                    placeholder="Template name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreatingNew(false); }}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleCreate} isLoading={createTemplate.isPending} className="flex-1">
                      Create
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCreatingNew(false)}>
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreatingNew(true)}
                  className="flex h-[180px] w-[140px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-strong text-ink-400 transition-colors hover:border-accent-600 hover:text-accent-600"
                >
                  <Plus size={22} strokeWidth={1.5} />
                  <span className="text-caption">New template</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Split-screen: customiser + live preview ───────────────────────── */}
      {activeTemplate && localDesign && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Left — customiser panel */}
          <div className="space-y-3 lg:col-span-2">
            {/* Template name */}
            <Card>
              <div className="px-4 py-3">
                <Input
                  label="Template name"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                />
              </div>
            </Card>

            {/* Tabs */}
            <Card>
              <Tabs tabs={DESIGNER_TABS} value={activeTab} onChange={(v) => setActiveTab(v as DesignerTab)} />

              <div className="p-4">
                {/* ── BRANDING TAB ──────────────────────────────────────── */}
                {activeTab === 'branding' && (
                  <div className="space-y-5">
                    {/* Logo */}
                    <div>
                      <p className="mb-2 text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
                        Company Logo
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-strong bg-sunken transition-colors hover:border-accent-600"
                          disabled={logoUploading}
                        >
                          {localDesign.branding.logoUrl ? (
                            <img
                              src={localDesign.branding.logoUrl}
                              alt="Logo"
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <ImagePlus size={18} className="text-ink-400" strokeWidth={1.5} />
                          )}
                          {logoUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
                            </div>
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-body-sm text-ink-900">
                            {localDesign.branding.logoUrl ? 'Logo set' : 'No logo'}
                          </p>
                          <p className="text-caption text-ink-400">PNG, SVG, JPG, WEBP</p>
                        </div>
                        <Switch
                          checked={localDesign.branding.showLogo}
                          onChange={(v) => patchBranding({ showLogo: v })}
                          label="Show"
                        />
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleLogoUpload}
                      />
                    </div>

                    {/* Color presets */}
                    <div>
                      <p className="mb-2 text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
                        Color Presets
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            title={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-subtle px-2.5 text-caption transition-colors hover:border-strong hover:bg-sunken"
                          >
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: preset.primary }}
                            />
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color pickers */}
                    <div className="grid grid-cols-2 gap-3">
                      <ColorField
                        label="Primary"
                        value={localDesign.branding.primaryColor}
                        onChange={(v) => patchBranding({ primaryColor: v })}
                      />
                      <ColorField
                        label="Accent"
                        value={localDesign.branding.accentColor}
                        onChange={(v) => patchBranding({ accentColor: v })}
                      />
                      <ColorField
                        label="Secondary"
                        value={localDesign.branding.secondaryColor}
                        onChange={(v) => patchBranding({ secondaryColor: v })}
                      />
                      <ColorField
                        label="Text"
                        value={localDesign.branding.textColor}
                        onChange={(v) => patchBranding({ textColor: v })}
                      />
                      <ColorField
                        label="Background"
                        value={localDesign.branding.backgroundColor}
                        onChange={(v) => patchBranding({ backgroundColor: v })}
                      />
                    </div>
                  </div>
                )}

                {/* ── LAYOUT TAB ────────────────────────────────────────── */}
                {activeTab === 'layout' && (
                  <div className="space-y-5">
                    {/* Theme */}
                    <div>
                      <p className="mb-2 text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
                        Base Theme
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {THEME_OPTIONS.map((theme) => (
                          <button
                            key={theme.value}
                            type="button"
                            onClick={() => {
                              // Apply a fresh palette for the chosen theme while preserving other settings
                              const palettes: Record<string, { primaryColor: string; secondaryColor: string; accentColor: string }> = {
                                classic: { primaryColor: localDesign.branding.primaryColor, secondaryColor: '#1E293B', accentColor: '#0EA5E9' },
                                modern: { primaryColor: localDesign.branding.primaryColor, secondaryColor: '#0F172A', accentColor: '#6366F1' },
                                minimal: { primaryColor: '#111827', secondaryColor: '#374151', accentColor: localDesign.branding.primaryColor },
                                bold: { primaryColor: localDesign.branding.primaryColor, secondaryColor: '#111827', accentColor: '#F97316' },
                                custom: { primaryColor: localDesign.branding.primaryColor, secondaryColor: localDesign.branding.secondaryColor, accentColor: localDesign.branding.accentColor },
                              };
                              const p = palettes[theme.value] ?? palettes.classic;
                              patchBranding(p);
                              patchLayout({ headerStyle: theme.value === 'modern' ? 'logo-top-banner' : 'logo-left' });
                            }}
                            className={`rounded-lg border px-3 py-2.5 text-left text-body-sm transition-all ${
                              activeTemplate.baseTheme === theme.value
                                ? 'border-accent-600 bg-accent-100 text-accent-700'
                                : 'border-subtle hover:border-strong hover:bg-sunken'
                            }`}
                          >
                            <p className="font-medium">{theme.label}</p>
                            <p className="text-caption text-ink-400">{theme.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Header style */}
                    <Select
                      label="Header Style"
                      value={localDesign.layout.headerStyle}
                      onChange={(v) => patchLayout({ headerStyle: v as HeaderStyle })}
                      options={HEADER_STYLE_OPTIONS}
                    />

                    {/* Page size */}
                    <Select
                      label="Page Size"
                      value={localDesign.layout.pageSize}
                      onChange={(v) => patchLayout({ pageSize: v as 'A4' | 'Letter' })}
                      options={[
                        { label: 'A4', value: 'A4' },
                        { label: 'Letter (US)', value: 'Letter' },
                      ]}
                    />
                  </div>
                )}

                {/* ── TYPOGRAPHY TAB ────────────────────────────────────── */}
                {activeTab === 'typography' && (
                  <div className="space-y-4">
                    <Select
                      label="Font Family"
                      value={localDesign.typography.fontFamily}
                      onChange={(v) => patchTypography({ fontFamily: v as FontFamily })}
                      options={FONT_OPTIONS}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
                          Body size (pt)
                        </label>
                        <input
                          type="number"
                          min={6}
                          max={18}
                          value={localDesign.typography.baseFontSize}
                          onChange={(e) => patchTypography({ baseFontSize: Number(e.target.value) })}
                          className="h-10 w-full rounded-lg border border-strong bg-surface px-3 text-body-sm text-ink-900 focus:outline-2 focus:outline-accent-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
                          Heading size (pt)
                        </label>
                        <input
                          type="number"
                          min={14}
                          max={48}
                          value={localDesign.typography.headingFontSize}
                          onChange={(e) => patchTypography({ headingFontSize: Number(e.target.value) })}
                          className="h-10 w-full rounded-lg border border-strong bg-surface px-3 text-body-sm text-ink-900 focus:outline-2 focus:outline-accent-600"
                        />
                      </div>
                    </div>

                    {/* Font preview */}
                    <div className="rounded-lg border border-subtle bg-sunken px-4 py-3">
                      <p
                        className="mb-1 text-[11px] text-ink-400"
                        style={{
                          fontFamily: `'${localDesign.typography.fontFamily}', sans-serif`,
                          fontSize: localDesign.typography.baseFontSize,
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </p>
                      <p
                        className="font-semibold"
                        style={{
                          fontFamily: `'${localDesign.typography.fontFamily}', sans-serif`,
                          fontSize: localDesign.typography.headingFontSize * 0.6,
                          color: localDesign.branding.primaryColor,
                        }}
                      >
                        INVOICE
                      </p>
                    </div>
                  </div>
                )}

                {/* ── SECTIONS TAB ──────────────────────────────────────── */}
                {activeTab === 'sections' && (
                  <div className="space-y-1">
                    <p className="mb-3 text-caption text-ink-400">
                      Toggle sections on/off. Use arrows to reorder the lower content blocks
                      (notes, terms, payment, signature, footer).
                    </p>
                    {sortedSections.map((key) => {
                      const sec = localDesign.sections[key];
                      const hasLabel = key === 'clientInfo' || key === 'notes' || key === 'terms';
                      const reorderable = isReorderable(key);
                      const groupIdx = reorderable ? reorderGroup.indexOf(key) : -1;
                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-subtle bg-surface px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            {/* Up/Down — only for reorderable content blocks */}
                            {reorderable ? (
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={groupIdx === 0}
                                  onClick={() => moveSectionOrder(key, 'up')}
                                  className="rounded p-0.5 text-ink-400 hover:bg-sunken disabled:opacity-30"
                                  aria-label="Move up"
                                >
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  disabled={groupIdx === reorderGroup.length - 1}
                                  onClick={() => moveSectionOrder(key, 'down')}
                                  className="rounded p-0.5 text-ink-400 hover:bg-sunken disabled:opacity-30"
                                  aria-label="Move down"
                                >
                                  <ChevronDown size={13} />
                                </button>
                              </div>
                            ) : (
                              <span className="w-[18px] shrink-0" aria-hidden />
                            )}
                            <span className="flex-1 text-body-sm font-medium text-ink-900">
                              {SECTION_LABELS[key]}
                            </span>
                            <Switch
                              checked={sec.visible}
                              onChange={(v) => patchSectionVisibility(key, v)}
                            />
                          </div>
                          {/* Editable label for some sections */}
                          {hasLabel && sec.visible && (
                            <div className="mt-2 pl-8">
                              <input
                                type="text"
                                value={(sec as { label: string }).label}
                                onChange={(e) =>
                                  patchSectionLabel(
                                    key as 'clientInfo' | 'notes' | 'terms',
                                    e.target.value,
                                  )
                                }
                                className="h-8 w-full rounded-md border border-strong bg-sunken px-2.5 text-caption text-ink-900 focus:outline-2 focus:outline-accent-600"
                                placeholder="Section label"
                              />
                            </div>
                          )}
                          {/* Items table sub-settings */}
                          {key === 'itemsTable' && sec.visible && (
                            <div className="mt-2 space-y-2 pl-8">
                              <Switch
                                checked={localDesign.sections.itemsTable.zebraStripes}
                                onChange={(v) =>
                                  setLocalDesign((d) =>
                                    d
                                      ? { ...d, sections: { ...d.sections, itemsTable: { ...d.sections.itemsTable, zebraStripes: v } } }
                                      : d,
                                  )
                                }
                                label="Zebra stripes"
                              />
                              <div className="flex flex-wrap gap-2">
                                {localDesign.sections.itemsTable.columns.map((col, ci) => (
                                  <label key={col.key} className="flex cursor-pointer items-center gap-1 text-caption">
                                    <input
                                      type="checkbox"
                                      checked={col.visible}
                                      onChange={(e) => {
                                        setLocalDesign((d) => {
                                          if (!d) return d;
                                          const cols = d.sections.itemsTable.columns.map((c, i) =>
                                            i === ci ? { ...c, visible: e.target.checked } : c,
                                          );
                                          return { ...d, sections: { ...d.sections, itemsTable: { ...d.sections.itemsTable, columns: cols } } };
                                        });
                                      }}
                                      className="accent-accent-600"
                                    />
                                    {col.label}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Signature sub-settings */}
                          {key === 'signature' && sec.visible && (
                            <div className="mt-2 space-y-2 pl-8">
                              <input
                                type="text"
                                value={localDesign.sections.signature.signatoryName ?? ''}
                                onChange={(e) =>
                                  setLocalDesign((d) =>
                                    d ? { ...d, sections: { ...d.sections, signature: { ...d.sections.signature, signatoryName: e.target.value } } } : d
                                  )
                                }
                                className="h-8 w-full rounded-md border border-strong bg-sunken px-2.5 text-caption text-ink-900 focus:outline-2 focus:outline-accent-600"
                                placeholder="Signatory name"
                              />
                              <input
                                type="text"
                                value={localDesign.sections.signature.signatoryTitle ?? ''}
                                onChange={(e) =>
                                  setLocalDesign((d) =>
                                    d ? { ...d, sections: { ...d.sections, signature: { ...d.sections.signature, signatoryTitle: e.target.value } } } : d
                                  )
                                }
                                className="h-8 w-full rounded-md border border-strong bg-sunken px-2.5 text-caption text-ink-900 focus:outline-2 focus:outline-accent-600"
                                placeholder="Signatory title"
                              />
                            </div>
                          )}
                          {/* Footer sub-settings */}
                          {key === 'footer' && sec.visible && (
                            <div className="mt-2 pl-8">
                              <input
                                type="text"
                                value={localDesign.sections.footer.content}
                                onChange={(e) =>
                                  setLocalDesign((d) =>
                                    d ? { ...d, sections: { ...d.sections, footer: { ...d.sections.footer, content: e.target.value } } } : d
                                  )
                                }
                                className="h-8 w-full rounded-md border border-strong bg-sunken px-2.5 text-caption text-ink-900 focus:outline-2 focus:outline-accent-600"
                                placeholder="Footer text"
                              />
                            </div>
                          )}
                          {/* Payment instructions content */}
                          {key === 'paymentInstructions' && sec.visible && (
                            <div className="mt-2 pl-8">
                              <textarea
                                rows={2}
                                value={localDesign.sections.paymentInstructions.content}
                                onChange={(e) =>
                                  setLocalDesign((d) =>
                                    d ? { ...d, sections: { ...d.sections, paymentInstructions: { ...d.sections.paymentInstructions, content: e.target.value } } } : d
                                  )
                                }
                                className="w-full rounded-md border border-strong bg-sunken px-2.5 py-1.5 text-caption text-ink-900 focus:outline-2 focus:outline-accent-600 resize-none"
                                placeholder="Bank account, payment link, etc."
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── ADVANCED TAB ──────────────────────────────────────── */}
                {activeTab === 'advanced' && (
                  <div className="space-y-5">
                    {/* Watermark */}
                    <div className="space-y-3">
                      <Switch
                        checked={localDesign.watermark.enabled}
                        onChange={(v) => patchWatermark({ enabled: v })}
                        label="Enable watermark"
                        description="Diagonal text overlay (e.g. DRAFT, PAID)"
                      />
                      {localDesign.watermark.enabled && (
                        <>
                          <Input
                            label="Watermark text"
                            value={localDesign.watermark.text}
                            onChange={(e) => patchWatermark({ text: e.target.value })}
                            placeholder="e.g. DRAFT"
                          />
                          <div>
                            <label className="mb-1.5 block text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
                              Opacity — {Math.round(localDesign.watermark.opacity * 100)}%
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={localDesign.watermark.opacity}
                              onChange={(e) => patchWatermark({ opacity: Number(e.target.value) })}
                              className="w-full accent-accent-600"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-caption font-medium uppercase tracking-[0.04em] text-ink-500">
                              Text size — {localDesign.watermark.fontSize ?? 72}px
                            </label>
                            <input
                              type="range"
                              min={16}
                              max={160}
                              step={1}
                              value={localDesign.watermark.fontSize ?? 72}
                              onChange={(e) => patchWatermark({ fontSize: Number(e.target.value) })}
                              className="w-full accent-accent-600"
                            />
                            <p className="mt-1 text-caption text-ink-400">
                              Lower the size if your watermark text is long so it fits on the page.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Items table header color */}
                    <ColorField
                      label="Table header background"
                      value={localDesign.sections.itemsTable.headerBackgroundColor}
                      onChange={(v) =>
                        setLocalDesign((d) =>
                          d ? { ...d, sections: { ...d.sections, itemsTable: { ...d.sections.itemsTable, headerBackgroundColor: v } } } : d
                        )
                      }
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right — live preview ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 lg:sticky lg:top-6">
            <div className="mb-2 flex items-center gap-1.5 text-caption text-ink-400">
              <Palette size={13} strokeWidth={1.5} /> Live preview
            </div>
            <div className="overflow-auto">
              <InvoicePreviewPane
                invoiceNumber="INV-1042"
                issueDate={SAMPLE_ISSUE_DATE}
                dueDate={SAMPLE_DUE_DATE}
                lineItems={SAMPLE_ITEMS}
                notes="Thank you for your continued business."
                terms="Payment due within 14 days of invoice date."
                template={previewTemplate}
                currency={company?.currency ?? 'USD'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no templates */}
      {!isLoading && (!templates || templates.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-strong py-20">
          <Palette size={36} className="text-ink-300" strokeWidth={1} />
          <p className="text-body-sm font-medium text-ink-600">No invoice templates yet</p>
          <p className="text-caption text-ink-400">Templates are created automatically when you complete onboarding.</p>
        </div>
      )}
    </>
  );
}
