import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { AiBadge, AiDisclaimer } from '@/components/domain/shared/AiBadge';
import { usePayrollInsights, useRefreshPayrollInsights } from '@/hooks/queries/useAi';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import type { AiPayrollAnomaly } from '@/types';

const SEVERITY_TONE: Record<AiPayrollAnomaly['severity'], 'info' | 'warning' | 'danger'> = {
  info: 'info',
  warning: 'warning',
  high: 'danger',
};

const ANOMALY_LABEL: Record<AiPayrollAnomaly['type'], string> = {
  salary_spike: 'Salary spike',
  missing_employee: 'Missing employee',
  excessive_overtime: 'Excessive overtime',
  duplicate_payment: 'Possible duplicate',
};

interface AiPayrollInsightsProps {
  payrollId: string;
  aiEnabled: boolean;
}

export function AiPayrollInsights({ payrollId, aiEnabled }: AiPayrollInsightsProps) {
  const { data, isLoading, isError } = usePayrollInsights(payrollId, aiEnabled);
  const refresh = useRefreshPayrollInsights(payrollId);

  if (!aiEnabled) return null;

  const change = data?.comparison;
  const positive = (change?.changePct ?? 0) > 0;

  return (
    <Card>
      <CardHeader
        title="Payroll AI insights"
        description="Plain-language summary and automatic anomaly checks for this run."
        ruled
        action={
          <div className="flex items-center gap-2">
            <AiBadge />
            <IconButton
              label="Regenerate insights"
              size="sm"
              icon={
                <RefreshCw
                  size={15}
                  strokeWidth={1.5}
                  className={cn(refresh.isPending && 'animate-spin')}
                />
              }
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending || isLoading}
            />
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      ) : isError ? (
        <p className="text-body-sm text-ink-600">
          Insights are unavailable right now. Try regenerating in a moment.
        </p>
      ) : data ? (
        <div className="space-y-5">
          {/* Month-over-month comparison */}
          {change && change.changeAmount !== null && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={positive ? 'warning' : 'success'} dot>
                {positive ? (
                  <TrendingUp size={13} strokeWidth={1.5} />
                ) : (
                  <TrendingDown size={13} strokeWidth={1.5} />
                )}
                {positive ? '+' : ''}
                {change.changePct}% vs previous run
              </Badge>
              <span className="text-body-sm text-ink-600">
                Net payroll {positive ? 'up' : 'down'}{' '}
                <span className="font-medium text-ink-900">
                  {formatCurrency(Math.abs(change.changeAmount))}
                </span>{' '}
                to{' '}
                <span className="font-medium text-ink-900">{formatCurrency(change.totalNet)}</span>
              </span>
            </div>
          )}

          {/* Narrative summary */}
          {data.summary ? (
            <p className="text-body-sm leading-relaxed text-ink-900">{data.summary}</p>
          ) : (
            <p className="text-body-sm text-ink-600">No summary was generated for this run.</p>
          )}

          {/* Anomalies */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-caption font-medium uppercase tracking-[0.02em] text-ink-600">
              <AlertTriangle size={13} strokeWidth={1.5} />
              Anomaly checks
            </h4>
            {data.anomalies.length === 0 ? (
              <p className="text-body-sm text-success-600">
                No anomalies detected against the previous run.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.anomalies.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-subtle p-3"
                  >
                    <Badge tone={SEVERITY_TONE[a.severity]} size="sm">
                      {ANOMALY_LABEL[a.type]}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-ink-900">
                        {a.employeeName}
                        {a.employeeCode && (
                          <span className="ml-1.5 font-data text-caption text-ink-400">
                            {a.employeeCode}
                          </span>
                        )}
                      </p>
                      <p className="text-caption text-ink-600">{a.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AiDisclaimer text="AI-generated summary. Anomaly checks are rule-based; always verify before paying." />
        </div>
      ) : null}
    </Card>
  );
}
