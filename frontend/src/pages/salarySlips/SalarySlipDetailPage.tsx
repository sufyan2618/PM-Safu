import { useParams } from 'react-router-dom';
import { Check, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { SalarySlipPreview } from '@/components/domain/salarySlips/SalarySlipPreview';
import { useMarkSlipPaid, useSalarySlip } from '@/hooks/queries/useSalarySlips';
import { useToast } from '@/hooks/useToast';
import { formatPeriod } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';

export function SalarySlipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data: slip, isLoading } = useSalarySlip(id);
  const markPaid = useMarkSlipPaid();

  if (isLoading || !slip) {
    return (
      <>
        <PageHeader
          title="Salary slip"
          breadcrumbs={[{ label: 'Salary slips', to: ROUTES.SALARY_SLIPS }]}
        />
        <Skeleton className="mx-auto h-[520px] max-w-2xl rounded-xl" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${slip.employee?.name ?? 'Salary slip'}`}
        description={`Pay period · ${formatPeriod(slip.period)}`}
        breadcrumbs={[
          { label: 'Salary slips', to: ROUTES.SALARY_SLIPS },
          { label: slip.employee?.name ?? 'Slip' },
        ]}
        actions={
          <>
            <Button variant="outline" leftIcon={<Download size={16} />} onClick={() => toast.info('Generating PDF…')}>
              Download PDF
            </Button>
            {slip.paymentStatus === 'pending' && (
              <Button
                leftIcon={<Check size={16} />}
                isLoading={markPaid.isPending}
                onClick={() => {
                  markPaid.mutate(slip.id);
                  toast.success('Marked as paid');
                }}
              >
                Mark as paid
              </Button>
            )}
          </>
        }
      />
      <div className="mx-auto max-w-2xl">
        <SalarySlipPreview slip={slip} />
      </div>
    </>
  );
}
