import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { Client, InvoiceTemplate } from '@/types';

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
}

export function InvoicePreviewPane({
  invoiceNumber = 'INV-0000',
  client,
  issueDate,
  dueDate,
  lineItems,
  notes,
  terms,
  template,
}: InvoicePreviewPaneProps) {
  const accent = template?.accentColor ?? '#0E7C5A';
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxTotal = lineItems.reduce(
    (s, li) => s + (li.quantity * li.unitPrice * (li.taxRate ?? 0)) / 100,
    0,
  );
  const total = subtotal + taxTotal;

  return (
    <div className="overflow-hidden rounded-xl border border-subtle bg-white text-[#0E1320] shadow-card">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: accent }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 4.5h12M3 9h12M3 13.5h7"
                  stroke="white"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="mt-2 text-[15px] font-semibold">Northwind Trading Co.</p>
            <p className="text-[11px] text-[#4B5468]">123 Market Street, San Francisco, CA</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-semibold uppercase tracking-wide" style={{ color: accent }}>
              Invoice
            </p>
            <p className="font-data text-[12px] text-[#4B5468]">{invoiceNumber}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-between gap-6 text-[12px]">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#8A92A3]">
              Bill to
            </p>
            <p className="font-medium">{client?.name ?? 'Select a client'}</p>
            {client?.companyName && <p className="text-[#4B5468]">{client.companyName}</p>}
            {client?.email && <p className="text-[#4B5468]">{client.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-[#8A92A3]">Issued</p>
            <p className="font-data">{issueDate ? formatDate(issueDate) : '—'}</p>
            <p className="mt-1 text-[#8A92A3]">Due</p>
            <p className="font-data">{dueDate ? formatDate(dueDate) : '—'}</p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${accent}33` }}>
              <th className="py-2 text-left font-medium text-[#8A92A3]">Description</th>
              <th className="py-2 text-right font-medium text-[#8A92A3]">Qty</th>
              <th className="py-2 text-right font-medium text-[#8A92A3]">Price</th>
              <th className="py-2 text-right font-medium text-[#8A92A3]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-[#8A92A3]">
                  Add line items to see them here
                </td>
              </tr>
            ) : (
              lineItems.map((li, i) => (
                <tr key={i} className="border-b border-[#E4E7EC]">
                  <td className="py-2 pr-2">{li.description || 'Item description'}</td>
                  <td className="py-2 text-right font-data">{li.quantity}</td>
                  <td className="py-2 text-right font-data">{formatCurrency(li.unitPrice)}</td>
                  <td className="py-2 text-right font-data">
                    {formatCurrency(li.quantity * li.unitPrice)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-52 space-y-1 text-[12px]">
            <div className="flex justify-between">
              <dt className="text-[#4B5468]">Subtotal</dt>
              <dd className="font-data">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#4B5468]">Tax</dt>
              <dd className="font-data">{formatCurrency(taxTotal)}</dd>
            </div>
            <div
              className="flex justify-between border-t pt-1 text-[14px] font-semibold"
              style={{ borderColor: `${accent}33` }}
            >
              <dt>Total</dt>
              <dd className="font-data" style={{ color: accent }}>
                {formatCurrency(total)}
              </dd>
            </div>
          </dl>
        </div>

        {(notes || terms) && (
          <div className="mt-6 space-y-2 border-t border-[#E4E7EC] pt-4 text-[11px] text-[#4B5468]">
            {notes && (
              <p>
                <span className="font-medium text-[#0E1320]">Notes: </span>
                {notes}
              </p>
            )}
            {terms && (
              <p>
                <span className="font-medium text-[#0E1320]">Terms: </span>
                {terms}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
