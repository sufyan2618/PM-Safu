import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Brand } from '@/components/layout/Brand';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/domain/shared/StatusPill';
import { InvoicePreviewPane } from '@/components/domain/invoices/InvoicePreviewPane';
import { useSharedInvoice } from '@/hooks/queries/useInvoices';
import { invoiceService } from '@/api/services/invoice.service';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';

export function InvoiceShareViewPage() {
  const { token } = useParams<{ token: string }>();
  const toast = useToast();
  const { data: invoice, isLoading } = useSharedInvoice(token);
  const [downloading, setDownloading] = useState(false);

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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-data text-display-sm text-ink-900">{invoice.invoiceNumber}</p>
                <p className="text-body-sm text-ink-600">
                  Amount due{' '}
                  <span className="font-data font-medium text-ink-900">
                    {formatCurrency(invoice.amountDue)}
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
