import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { Checkbox } from '@/components/ui/Checkbox';
import { Avatar } from '@/components/ui/Avatar';
import { PayrollSummaryCard } from '@/components/domain/payroll/PayrollSummaryCard';
import { useEmployees } from '@/hooks/queries/useEmployees';
import { useProcessPayroll } from '@/hooks/queries/usePayroll';
import { usePayrollRunStore } from '@/store/payrollRunStore';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatPeriod } from '@/utils/formatDate';
import { ROUTES } from '@/constants/routes.constants';

const STEPS = [
  { label: 'Select period', description: 'Choose the month' },
  { label: 'Review employees', description: 'Confirm who is paid' },
  { label: 'Confirm', description: 'Verify totals' },
  { label: 'Summary', description: 'Done' },
];

function periodOptions(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export function PayrollRunProcessPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentStep, selectedPeriod, reviewedEmployeeIds, setPeriod, setReviewed, goToStep, reset } =
    usePayrollRunStore();
  const [processed, setProcessed] = useState(false);

  const employees = useEmployees({ pageSize: 100, status: 'active' });
  const processPayroll = useProcessPayroll();
  const activeEmployees = useMemo(() => employees.data?.items ?? [], [employees.data]);

  const selected = useMemo(
    () =>
      reviewedEmployeeIds.length > 0
        ? activeEmployees.filter((e) => reviewedEmployeeIds.includes(e.id))
        : activeEmployees,
    [activeEmployees, reviewedEmployeeIds],
  );

  const totals = useMemo(() => {
    let gross = 0;
    let deductions = 0;
    for (const emp of selected) {
      const s = emp.salaryStructure;
      if (!s) continue;
      const allowances = s.allowances.reduce((sum, a) => sum + a.amount, 0);
      const ded = s.deductions.reduce((sum, d) => sum + d.amount, 0);
      gross += s.basic + allowances;
      deductions += ded;
    }
    return { gross, deductions, net: gross - deductions, count: selected.length };
  }, [selected]);

  async function handleProcess() {
    try {
      await processPayroll.mutateAsync({
        period: selectedPeriod,
        employeeIds: selected.map((e) => e.id),
      });
      setProcessed(true);
      goToStep(3);
      toast.success('Payroll processed', `${selected.length} salary slips generated.`);
    } catch {
      toast.error('Processing failed');
    }
  }

  function finish() {
    reset();
    navigate(ROUTES.PAYROLL_RUNS);
  }

  return (
    <>
      <PageHeader
        title="Run payroll"
        breadcrumbs={[{ label: 'Payroll', to: ROUTES.PAYROLL_RUNS }, { label: 'Process' }]}
      />

      <Card className="mb-6">
        <Stepper steps={STEPS} current={currentStep} />
      </Card>

      {currentStep === 0 && (
        <Card>
          <CardHeader title="Select pay period" ruled />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {periodOptions().map((period) => {
              const active = period === selectedPeriod;
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPeriod(period)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-accent-600 bg-accent-100'
                      : 'border-subtle hover:bg-sunken'
                  }`}
                >
                  <p className={`text-body-sm font-medium ${active ? 'text-accent-600' : 'text-ink-900'}`}>
                    {formatPeriod(period)}
                  </p>
                  <p className="font-data text-caption text-ink-400">{period}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <Button rightIcon={<ArrowRight size={16} />} onClick={() => goToStep(1)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader
            title="Review employees"
            description={`${selected.length} of ${activeEmployees.length} selected`}
            ruled
          />
          <div className="space-y-1">
            {activeEmployees.map((emp) => {
              const checked =
                reviewedEmployeeIds.length === 0 || reviewedEmployeeIds.includes(emp.id);
              return (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-sunken"
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => {
                      const base =
                        reviewedEmployeeIds.length === 0
                          ? activeEmployees.map((e) => e.id)
                          : reviewedEmployeeIds;
                      setReviewed(
                        base.includes(emp.id)
                          ? base.filter((x) => x !== emp.id)
                          : [...base, emp.id],
                      );
                    }}
                  />
                  <Avatar name={emp.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-medium text-ink-900">{emp.name}</p>
                    <p className="truncate text-caption text-ink-400">{emp.designation}</p>
                  </div>
                  <span className="font-data text-body-sm text-ink-600">
                    {formatCurrency(emp.salaryStructure?.basic ?? 0)}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mt-6 flex justify-between">
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />} onClick={() => goToStep(0)}>
              Back
            </Button>
            <Button rightIcon={<ArrowRight size={16} />} onClick={() => goToStep(2)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <PayrollSummaryCard
            totalGross={totals.gross}
            totalDeductions={totals.deductions}
            totalNet={totals.net}
            employeeCount={totals.count}
          />
          <Card>
            <CardHeader title="Confirm & process" ruled />
            <p className="text-body-sm text-ink-600">
              You're about to process payroll for{' '}
              <span className="font-medium text-ink-900">{formatPeriod(selectedPeriod)}</span>,
              generating <span className="font-medium text-ink-900">{totals.count}</span> salary
              slips with a net payout of{' '}
              <span className="font-data font-medium text-accent-600">
                {formatCurrency(totals.net)}
              </span>
              .
            </p>
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                leftIcon={<ArrowLeft size={16} />}
                onClick={() => goToStep(1)}
              >
                Back
              </Button>
              <Button
                onClick={handleProcess}
                isLoading={processPayroll.isPending}
                leftIcon={processPayroll.isPending ? <Loader2 size={16} /> : undefined}
              >
                Process payroll
              </Button>
            </div>
          </Card>
        </div>
      )}

      {currentStep === 3 && processed && (
        <Card className="flex flex-col items-center py-12 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
            <CheckCircle2 size={28} strokeWidth={1.5} className="text-success-600" />
          </span>
          <h2 className="text-display-sm text-ink-900">Payroll processed</h2>
          <p className="mt-2 max-w-sm text-body-sm text-ink-600">
            {totals.count} salary slips for {formatPeriod(selectedPeriod)} were generated and are
            ready to review.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => navigate(ROUTES.SALARY_SLIPS)}>
              View salary slips
            </Button>
            <Button onClick={finish}>Done</Button>
          </div>
        </Card>
      )}
    </>
  );
}
