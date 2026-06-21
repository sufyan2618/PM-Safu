import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Brand } from '@/components/layout/Brand';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { InvoicePreviewPane } from '@/components/domain/invoices/InvoicePreviewPane';
import { useSharedInvoice } from '@/hooks/queries/useInvoices';
import { invoiceService } from '@/api/services/invoice.service';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';

const MAX_POLLS = 10;

export function InvoiceShareViewPage() {
  const { token } = useParams<{ token: string }>();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get('paid') === '1';
  const canceled = searchParams.get('canceled') === '1';

  const [polls, setPolls] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState('');

  // After returning from Checkout, poll until the webhook records the payment (or we give up).
  const pollMs = justPaid && polls < MAX_POLLS ? 3000 : undefined;
  const { data, isLoading } = useSharedInvoice(token, pollMs);
  const invoice = data?.invoice;
  const paymentsEnabled = data?.paymentsEnabled ?? false;

  useEffect(() => {
    if (justPaid && invoice && invoice.status !== 'paid') {
      setPolls((p) => p + 1);
    }
  }, [justPaid, invoice]);

  useEffect(() => {
    if (invoice && amount === '') {
      setAmount(String(invoice.amountDue));
    }
  }, [invoice, amount]);

  const amountValid = useMemo(() => {
    if (!invoice) return false;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 && n <= invoice.amountDue + 0.001;
  }, [amount, invoice]);

  async function downloadPdf() {
    if (!token || !invoice) return;
    setDownloading(true);
    try {
      await invoiceService.downloadSharePdf(token, `${invoice.invoiceNumber}.pdf`);
    } catch {
      toast.error('Could not download PDF');
    } finally {
      setDownloading(false);
    }
  }

  async function pay() {
    if (!token || !invoice || !amountValid) return;
    setPaying(true);
    try {
      const { url } = await invoiceService.payShare(token, Number(amount));
      window.location.href = url;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error('Could not start payment', message ?? 'Please try again.');
      setPaying(false);
    }
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-subtle bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Brand />
          {invoice && <StatusPill kind="invoice" status={invoice.status} />}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {isLoading || !invoice ? (
          <Skeleton className="h-[600px] rounded-xl" />
        ) : (
          <>
            {justPaid && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-success-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <p className="text-body-sm">
                  {invoice.status === 'paid'
                    ? 'Payment received — this invoice is fully paid. Thank you!'
                    : 'Payment received. We are updating the invoice…'}
                </p>
              </div>
            )}
            {canceled && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-subtle bg-surface px-4 py-3 text-ink-600">
                <Info size={18} className="mt-0.5 shrink-0" />
                <p className="text-body-sm">Payment canceled. You can try again anytime.</p>
              </div>
            )}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-data text-display-sm text-ink-900">{invoice.invoiceNumber}</p>
                <p className="text-body-sm text-ink-600">
                  Amount due{' '}
                  <span className="font-data font-medium text-ink-900">
                    {formatCurrency(invoice.amountDue, { currency: invoice.currency })}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden rounded-lg border border-subtle bg-surface p-2 sm:block">
                  <QRCodeSVG value={window.location.href} size={72} level="M" />
                </div>
                <Button
                  variant="outline"
                  leftIcon={<Download size={16} />}
                  isLoading={downloading}
                  onClick={downloadPdf}
                >
                  Download PDF
                </Button>
              </div>
            </div>

            {paymentsEnabled && invoice.amountDue > 0 && (
              <div className="mb-4 rounded-xl border border-subtle bg-surface p-4">
                <p className="mb-3 text-body-sm font-medium text-ink-900">Pay this invoice</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="sm:w-48">
                    <Input
                      label="Amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      helperText={`Up to ${formatCurrency(invoice.amountDue, { currency: invoice.currency })}`}
                    />
                  </div>
                  <Button
                    className="sm:mb-1"
                    isLoading={paying}
                    disabled={!amountValid}
                    onClick={pay}
                  >
                    Pay now
                  </Button>
                </div>
                <p className="mt-2 text-caption text-ink-400">
                  Secure payment powered by Stripe. You can pay the full balance or a partial
                  amount.
                </p>
              </div>
            )}

            <InvoicePreviewPane
              invoiceNumber={invoice.invoiceNumber}
              client={invoice.client}
              issueDate={invoice.issueDate}
              dueDate={invoice.dueDate}
              lineItems={invoice.lineItems}
              notes={invoice.notes}
              terms={invoice.terms}
            />
          </>
        )}
        <p className="mt-6 text-center text-caption text-ink-400">
          Powered by PM-Safu — Invoice &amp; Payroll
        </p>
      </main>
    </div>
  );
}
