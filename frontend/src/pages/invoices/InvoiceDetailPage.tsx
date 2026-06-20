import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, Link2, Pencil, Send, Trash2, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { InvoicePreviewPane } from '@/components/domain/invoices/InvoicePreviewPane';
import { useInvoice, useInvoiceActions, useInvoiceTemplates } from '@/hooks/queries/useInvoices';
import { invoiceService } from '@/api/services/invoice.service';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: templates } = useInvoiceTemplates();
  const actions = useInvoiceActions(id ?? '');

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [downloading, setDownloading] = useState(false);

  if (isLoading || !invoice) {
    return (
      <>
        <PageHeader title="Invoice" breadcrumbs={[{ label: 'Invoices', to: ROUTES.INVOICES }]} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </>
    );
  }

  const invoiceTemplate =
    templates?.find((t) => t.id === invoice.templateId) ??
    templates?.find((t) => t.isDefault) ??
    null;

  const shareUrl = `${window.location.origin}${ROUTES.INVOICE_SHARE(invoice.shareToken ?? '')}`;

  // Per-rate tax breakdown for the summary (grouped by line-item tax rate).
  const taxByRate = new Map<number, number>();
  for (const item of invoice.lineItems) {
    const rate = item.taxRate ?? 0;
    if (rate <= 0) continue;
    const base = item.quantity * item.unitPrice;
    taxByRate.set(rate, (taxByRate.get(rate) ?? 0) + (base * rate) / 100);
  }
  const taxBreakdown = [...taxByRate.entries()].sort((a, b) => a[0] - b[0]);

  function copyShareLink() {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied');
  }

  async function downloadPdf() {
    if (!invoice) return;
    setDownloading(true);
    try {
      await invoiceService.downloadPdf(invoice.id, `${invoice.invoiceNumber}.pdf`);
    } catch {
      toast.error('Could not download PDF');
    } finally {
      setDownloading(false);
    }
  }

  async function recordPayment() {
    if (!invoice) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    if (amount > invoice.amountDue) {
      toast.error(
        'Amount exceeds balance',
        `The outstanding balance is ${formatCurrency(invoice.amountDue, { currency: invoice.currency })}.`,
      );
      return;
    }
    try {
      await actions.recordPayment.mutateAsync({ amount, method: payMethod });
      toast.success('Payment recorded');
      setPayOpen(false);
      setPayAmount('');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error('Could not record payment', message ?? 'Please try again.');
    }
  }

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[{ label: 'Invoices', to: ROUTES.INVOICES }, { label: invoice.invoiceNumber }]}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Download size={16} />}
              isLoading={downloading}
              onClick={downloadPdf}
            >
              PDF
            </Button>
            {invoice.status === 'draft' ? (
              <>
                <Button
                  variant="outline"
                  leftIcon={<Pencil size={16} />}
                  onClick={() => navigate(ROUTES.INVOICE_EDIT(invoice.id))}
                >
                  Edit
                </Button>
                <Button leftIcon={<Send size={16} />} onClick={() => actions.send.mutate()}>
                  Send invoice
                </Button>
              </>
            ) : (
              <Button leftIcon={<Wallet size={16} />} onClick={() => setPayOpen(true)}>
                Record payment
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvoicePreviewPane
            invoiceNumber={invoice.invoiceNumber}
            client={invoice.client}
            issueDate={invoice.issueDate}
            dueDate={invoice.dueDate}
            lineItems={invoice.lineItems}
            notes={invoice.notes}
            terms={invoice.terms}
            template={invoiceTemplate}
            currency={invoice.currency}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Summary" ruled />
            <dl className="space-y-2.5 text-body-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-600">Status</dt>
                <dd>
                  <StatusPill kind="invoice" status={invoice.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="font-data text-ink-900">{formatCurrency(invoice.subtotal)}</dd>
              </div>
              {taxBreakdown.length > 0
                ? taxBreakdown.map(([rate, amount]) => (
                    <div key={rate} className="flex items-center justify-between">
                      <dt className="text-ink-600">Tax ({rate}%)</dt>
                      <dd className="font-data text-ink-900">{formatCurrency(amount)}</dd>
                    </div>
                  ))
                : invoice.taxTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-ink-600">Tax</dt>
                      <dd className="font-data text-ink-900">{formatCurrency(invoice.taxTotal)}</dd>
                    </div>
                  )}
              <div className="flex items-center justify-between border-t border-subtle pt-2.5">
                <dt className="text-ink-600">Total</dt>
                <dd className="font-data font-medium text-ink-900">{formatCurrency(invoice.total)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-600">Paid</dt>
                <dd className="font-data text-success-600">{formatCurrency(invoice.amountPaid)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-accent-600/20 pt-2.5">
                <dt className="font-medium text-ink-900">Amount due</dt>
                <dd className="font-data font-semibold text-ink-900">
                  {formatCurrency(invoice.amountDue)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Share" ruled />
            {invoice.shareToken && (
              <div className="flex items-center gap-2 rounded-lg border border-subtle bg-sunken px-3 py-2">
                <Link2 size={15} strokeWidth={1.5} className="shrink-0 text-ink-400" />
                <span className="truncate font-data text-caption text-ink-600">{shareUrl}</span>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="ml-auto shrink-0 text-ink-400 transition-colors hover:text-accent-600"
                  aria-label="Copy link"
                >
                  <Copy size={15} strokeWidth={1.5} />
                </button>
              </div>
            )}
            {invoice.shareToken ? (
              <div className="mt-3 flex justify-center rounded-lg border border-subtle bg-white p-3">
                <QRCodeSVG value={shareUrl} size={96} level="M" />
              </div>
            ) : (
              <p className="mt-3 text-center text-caption text-ink-400">
                Send the invoice to generate a shareable link and QR code.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Payment history" ruled />
            {invoice.paymentHistory.length === 0 ? (
              <p className="py-2 text-body-sm text-ink-400">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-subtle">
                {invoice.paymentHistory.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-data text-body-sm font-medium text-ink-900">
                        {formatCurrency(p.amount)}
                      </p>
                      <p className="text-caption capitalize text-ink-400">
                        {p.method.replace('_', ' ')} · {formatDate(p.paidOn)}
                      </p>
                    </div>
                    <span className="font-data text-caption text-ink-400">{p.reference}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {invoice.status === 'draft' && (
            <Button
              variant="destructive"
              fullWidth
              leftIcon={<Trash2 size={16} />}
              onClick={() => {
                actions.remove.mutate();
                toast.success('Invoice deleted');
                navigate(ROUTES.INVOICES);
              }}
            >
              Delete draft
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record payment"
        description={`Outstanding: ${formatCurrency(invoice.amountDue)}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={recordPayment} isLoading={actions.recordPayment.isPending}>
              Record
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Amount"
            type="number"
            isMono
            rightAddon="USD"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Select
            label="Method"
            value={payMethod}
            onChange={(v) => setPayMethod(v as string)}
            options={[
              { label: 'Bank transfer', value: 'bank_transfer' },
              { label: 'Card', value: 'card' },
              { label: 'Cash', value: 'cash' },
              { label: 'Cheque', value: 'cheque' },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
