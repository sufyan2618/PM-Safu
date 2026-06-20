import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { useAuthStore } from '@/store/authStore';
import type { Client, InvoiceTemplate, ItemColumn } from '@/types';

export interface PreviewLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

interface InvoicePreviewPaneProps {
  invoiceNumber?: string;
  client?: Client;
  issueDate?: string;
  dueDate?: string;
  lineItems: PreviewLineItem[];
  notes?: string;
  terms?: string;
  template?: InvoiceTemplate | null;
  currency?: string;
  /** Scale the preview (default 1). The designer uses 0.9 to fit in the panel. */
  scale?: number;
}

const FONT_STACK: Record<string, string> = {
  Inter: "'Inter', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Lato: "'Lato', sans-serif",
  Merriweather: "'Merriweather', serif",
  Custom: 'sans-serif',
};

function HLine({ color }: { color: string }) {
  return <div className="w-full" style={{ height: 1, backgroundColor: `${color}33` }} />;
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <p
      className="mb-1 text-[9px] font-semibold uppercase tracking-[0.06em]"
      style={{ color: `${color}99` }}
    >
      {text}
    </p>
  );
}

export function InvoicePreviewPane({
  invoiceNumber = 'INV-0001',
  client,
  issueDate,
  dueDate,
  lineItems,
  notes,
  terms,
  template,
  currency = 'USD',
  scale = 1,
}: InvoicePreviewPaneProps) {
  const company = useAuthStore((s) => s.company);

  const design = template?.design;
  const branding = design?.branding;
  const typo = design?.typography;
  const layout = design?.layout;
  const sections = design?.sections;
  const watermark = design?.watermark;

  const primary = branding?.primaryColor ?? '#2563EB';
  const accent = branding?.accentColor ?? '#0EA5E9';
  const secondary = branding?.secondaryColor ?? '#1E293B';
  const bgColor = branding?.backgroundColor ?? '#FFFFFF';
  const textColor = branding?.textColor ?? '#111111';
  const headerStyle = layout?.headerStyle ?? 'logo-left';
  const fontFamily = FONT_STACK[typo?.fontFamily ?? 'Inter'] ?? FONT_STACK.Inter;
  const baseSize = typo?.baseFontSize ?? 11;
  const headingSize = typo?.headingFontSize ?? 22;
  const baseTheme = template?.baseTheme ?? 'classic';

  const logoUrl = branding?.logoUrl ?? company?.logoUrl;
  const showLogo = branding?.showLogo !== false;
  const companyName = company?.companyName ?? 'Your Company';
  const companyAddress = (company as { address?: { city?: string; country?: string } } | null)
    ?.address;

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxTotal = lineItems.reduce(
    (s, li) => s + (li.quantity * li.unitPrice * (li.taxRate ?? 0)) / 100,
    0,
  );
  const total = subtotal + taxTotal;
  const fmt = (v: number) => formatCurrency(v, { currency });

  const visibleColumns: ItemColumn[] = sections?.itemsTable?.columns?.filter((c) => c.visible) ?? [
    { key: 'description', label: 'Description', visible: true, width: '40%' },
    { key: 'quantity', label: 'Qty', visible: true, width: '12%' },
    { key: 'unitPrice', label: 'Unit Price', visible: true, width: '16%' },
    { key: 'amount', label: 'Amount', visible: true, width: '20%' },
  ];

  function cellValue(col: ItemColumn, li: PreviewLineItem, _i: number) {
    switch (col.key) {
      case 'description': return li.description || 'Item description';
      case 'quantity': return li.quantity;
      case 'unitPrice': return fmt(li.unitPrice);
      case 'taxRate': return li.taxRate != null ? `${li.taxRate}%` : '—';
      case 'discount': return '—';
      case 'amount': return fmt(li.quantity * li.unitPrice);
      default: return '—';
    }
  }

  const headerBg = sections?.itemsTable?.headerBackgroundColor ?? '#F1F5F9';
  const zebraStripes = sections?.itemsTable?.zebraStripes ?? false;

  // ── Banner style (Modern / logo-top-banner) ────────────────────────────────
  const isBanner = headerStyle === 'logo-top-banner' || baseTheme === 'modern';
  // ── Minimal style ─────────────────────────────────────────────────────────
  const isMinimal = baseTheme === 'minimal';
  // ── Bold style ────────────────────────────────────────────────────────────
  const isBold = baseTheme === 'bold';

  const logoNode =
    showLogo && logoUrl ? (
      <img
        src={logoUrl}
        alt="Logo"
        className="object-contain rounded"
        style={{ height: 36, maxWidth: 100 }}
      />
    ) : showLogo ? (
      <div
        className="flex items-center justify-center rounded-lg text-white font-bold"
        style={{
          width: 36,
          height: 36,
          backgroundColor: isBold ? accent : primary,
          fontSize: baseSize + 4,
        }}
      >
        {companyName.charAt(0)}
      </div>
    ) : null;

  const nameBlock = (align: 'left' | 'right') => (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className="font-semibold" style={{ color: secondary, fontSize: baseSize + 1 }}>
        {companyName}
      </p>
      {companyAddress && (
        <p style={{ fontSize: baseSize - 1, color: `${secondary}88` }}>
          {[companyAddress.city, companyAddress.country].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  );

  const titleBlock = (align: 'left' | 'center' | 'right') => (
    <div className={align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}>
      <p
        className="font-bold uppercase tracking-wide"
        style={{ fontSize: headingSize * 0.55, color: isBold ? accent : primary }}
      >
        {isMinimal ? 'Invoice' : 'INVOICE'}
      </p>
      <p className="font-mono" style={{ fontSize: baseSize - 1, color: `${secondary}99` }}>
        {invoiceNumber}
      </p>
    </div>
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-subtle shadow-card"
      style={{
        fontFamily,
        fontSize: baseSize,
        color: textColor,
        backgroundColor: bgColor,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: scale !== 1 ? 'top left' : undefined,
        width: scale !== 1 ? `${100 / scale}%` : undefined,
      }}
    >
      {/* Watermark */}
      {watermark?.enabled && watermark.text && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ zIndex: 10 }}
        >
          <span
            className="select-none font-bold uppercase tracking-widest"
            style={{
              fontSize: watermark.fontSize ?? 72,
              color: secondary,
              opacity: watermark.opacity ?? 0.08,
              transform: 'rotate(-30deg)',
              whiteSpace: 'nowrap',
            }}
          >
            {watermark.text}
          </span>
        </div>
      )}

      {/* ── BANNER HEADER (Modern) ─────────────────────────────────────────── */}
      {isBanner && (
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ backgroundColor: primary }}
        >
          <div className="flex items-center gap-3">
            {showLogo && logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1" />
            ) : showLogo ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white font-bold text-lg">
                {companyName.charAt(0)}
              </div>
            ) : null}
            <span className="font-semibold text-white" style={{ fontSize: baseSize + 2 }}>
              {companyName}
            </span>
          </div>
          <div className="text-right text-white">
            <div className="font-bold uppercase tracking-widest" style={{ fontSize: headingSize * 0.6 }}>
              Invoice
            </div>
            <div className="font-mono opacity-80" style={{ fontSize: baseSize - 1 }}>
              {invoiceNumber}
            </div>
          </div>
        </div>
      )}

      {/* ── Classic / Minimal / Bold top bar ──────────────────────────────── */}
      {!isBanner && (
        <>
          {!isMinimal && (
            <div className="h-1.5 w-full" style={{ backgroundColor: isBold ? accent : primary }} />
          )}

          {headerStyle === 'logo-center' ? (
            <div className="flex flex-col items-center gap-1 px-7 pt-6 pb-2 text-center">
              {logoNode}
              <p className="font-semibold" style={{ color: secondary, fontSize: baseSize + 2 }}>
                {companyName}
              </p>
              {companyAddress && (
                <p style={{ fontSize: baseSize - 1, color: `${secondary}88` }}>
                  {[companyAddress.city, companyAddress.country].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="mt-1">{titleBlock('center')}</div>
            </div>
          ) : (
            <div className="flex items-start justify-between px-7 pt-6 pb-2">
              {headerStyle === 'logo-right' ? (
                <>
                  {titleBlock('left')}
                  <div className="flex items-center gap-3">
                    {nameBlock('right')}
                    {logoNode}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {logoNode}
                    {nameBlock('left')}
                  </div>
                  {titleBlock('right')}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Client + Meta ─────────────────────────────────────────────────── */}
      {(sections?.clientInfo?.visible !== false || sections?.invoiceMeta?.visible !== false) && (
        <div className="mx-7 mt-4 mb-4 flex justify-between gap-6" style={{ fontSize: baseSize }}>
          {sections?.clientInfo?.visible !== false && (
            <div>
              <SectionLabel text={sections?.clientInfo?.label ?? 'Bill To'} color={primary} />
              <p className="font-medium">{client?.name ?? 'Client Name'}</p>
              {client?.companyName && (
                <p style={{ color: `${textColor}99` }}>{client.companyName}</p>
              )}
              {client?.email && (
                <p style={{ color: `${textColor}99` }}>{client.email}</p>
              )}
            </div>
          )}
          {sections?.invoiceMeta?.visible !== false && (
            <div className="text-right shrink-0">
              <div className="space-y-0.5">
                <div>
                  <span style={{ color: `${textColor}60`, fontSize: baseSize - 1 }}>Issued </span>
                  <span className="font-mono" style={{ fontSize: baseSize - 1 }}>
                    {issueDate ? formatDate(issueDate) : '—'}
                  </span>
                </div>
                <div>
                  <span style={{ color: `${textColor}60`, fontSize: baseSize - 1 }}>Due </span>
                  <span className="font-mono" style={{ fontSize: baseSize - 1 }}>
                    {dueDate ? formatDate(dueDate) : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mx-7 mb-1">
        <HLine color={primary} />
      </div>

      {/* ── Items Table ────────────────────────────────────────────────────── */}
      {sections?.itemsTable?.visible !== false && (
        <div className="mx-7 mt-3">
          <table className="w-full border-collapse" style={{ fontSize: baseSize - 0.5 }}>
            <thead>
              <tr style={{ backgroundColor: isMinimal ? 'transparent' : headerBg }}>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className="py-1.5 font-semibold"
                    style={{
                      textAlign: col.key === 'description' ? 'left' : 'right',
                      width: col.width,
                      paddingLeft: col.key === 'description' ? 6 : 0,
                      paddingRight: 6,
                      color: `${textColor}70`,
                      borderBottom: `1px solid ${primary}44`,
                      fontSize: baseSize - 2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="py-5 text-center"
                    style={{ color: `${textColor}50` }}
                  >
                    Add line items to see them here
                  </td>
                </tr>
              ) : (
                lineItems.map((li, i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: zebraStripes && i % 2 === 1 ? `${primary}08` : 'transparent',
                      borderBottom: `1px solid ${primary}18`,
                    }}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className="py-1.5"
                        style={{
                          textAlign: col.key === 'description' ? 'left' : 'right',
                          paddingLeft: col.key === 'description' ? 6 : 0,
                          paddingRight: 6,
                          fontVariantNumeric: col.key !== 'description' ? 'tabular-nums' : undefined,
                        }}
                      >
                        {cellValue(col, li, i)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      {sections?.summary?.visible !== false && (
        <div className="mx-7 mt-3 flex justify-end">
          <dl className="w-44 space-y-0.5" style={{ fontSize: baseSize - 0.5 }}>
            <div className="flex justify-between">
              <dt style={{ color: `${textColor}70` }}>Subtotal</dt>
              <dd className="font-mono">{fmt(subtotal)}</dd>
            </div>
            {taxTotal > 0 && (
              <div className="flex justify-between">
                <dt style={{ color: `${textColor}70` }}>Tax</dt>
                <dd className="font-mono">{fmt(taxTotal)}</dd>
              </div>
            )}
            <div
              className="flex justify-between border-t pt-1 font-semibold"
              style={{ borderColor: `${primary}33`, fontSize: baseSize + 1 }}
            >
              <dt>Total</dt>
              <dd className="font-mono" style={{ color: primary }}>
                {fmt(total)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* ── Notes / Terms / Payment / Signature / Footer (ordered) ────────── */}
      {(() => {
        const blocks: { key: string; order: number; node: React.ReactNode }[] = [];

        if (sections?.notes?.visible !== false && notes) {
          blocks.push({
            key: 'notes',
            order: sections?.notes?.order ?? 6,
            node: (
              <p>
                <span className="font-semibold" style={{ color: secondary }}>
                  {sections?.notes?.label ?? 'Notes'}:{' '}
                </span>
                <span style={{ color: `${textColor}80` }}>{notes}</span>
              </p>
            ),
          });
        }
        if (sections?.terms?.visible !== false && terms) {
          blocks.push({
            key: 'terms',
            order: sections?.terms?.order ?? 7,
            node: (
              <p>
                <span className="font-semibold" style={{ color: secondary }}>
                  {sections?.terms?.label ?? 'Terms & Conditions'}:{' '}
                </span>
                <span style={{ color: `${textColor}80` }}>{terms}</span>
              </p>
            ),
          });
        }
        if (sections?.paymentInstructions?.visible && sections.paymentInstructions.content) {
          blocks.push({
            key: 'payment',
            order: sections?.paymentInstructions?.order ?? 8,
            node: (
              <p>
                <span className="font-semibold" style={{ color: secondary }}>Payment: </span>
                <span style={{ color: `${textColor}80` }}>{sections.paymentInstructions.content}</span>
              </p>
            ),
          });
        }
        if (sections?.signature?.visible) {
          blocks.push({
            key: 'signature',
            order: sections?.signature?.order ?? 9,
            node: (
              <div className="mt-2 flex flex-col gap-1">
                <div className="h-8 w-24 border-b" style={{ borderColor: `${primary}44` }} />
                {sections.signature.signatoryName && (
                  <p className="font-medium" style={{ fontSize: baseSize - 1 }}>{sections.signature.signatoryName}</p>
                )}
                {sections.signature.signatoryTitle && (
                  <p style={{ fontSize: baseSize - 2, color: `${textColor}60` }}>{sections.signature.signatoryTitle}</p>
                )}
              </div>
            ),
          });
        }
        if (sections?.footer?.visible !== false && sections?.footer?.content) {
          blocks.push({
            key: 'footer',
            order: sections?.footer?.order ?? 10,
            node: (
              <p className="pt-1" style={{ color: `${textColor}50`, fontSize: baseSize - 2 }}>
                {sections.footer.content}
              </p>
            ),
          });
        }

        if (blocks.length === 0) return null;
        blocks.sort((a, b) => a.order - b.order);

        return (
          <div
            className="mx-7 mt-5 mb-6 space-y-2 border-t pt-4"
            style={{ borderColor: `${primary}22`, fontSize: baseSize - 1 }}
          >
            {blocks.map((b) => (
              <div key={b.key}>{b.node}</div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
