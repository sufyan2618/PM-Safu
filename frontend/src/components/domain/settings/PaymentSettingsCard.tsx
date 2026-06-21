import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConnectStatus, useStartOnboarding } from '@/hooks/queries/usePayments';
import { useToast } from '@/hooks/useToast';

export function PaymentSettingsCard() {
  const toast = useToast();
  const { data: status, isLoading, refetch } = useConnectStatus();
  const startOnboarding = useStartOnboarding();
  const [searchParams, setSearchParams] = useSearchParams();

  // After returning from Stripe-hosted onboarding, refresh the live account status.
  useEffect(() => {
    if (searchParams.get('connected') || searchParams.get('refresh')) {
      void refetch();
      const next = new URLSearchParams(searchParams);
      next.delete('connected');
      next.delete('refresh');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, refetch]);

  async function handleConnect() {
    try {
      const { url } = await startOnboarding.mutateAsync();
      window.location.href = url;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error('Could not start Stripe onboarding', message ?? 'Please try again.');
    }
  }

  const isActive = status?.connected && status.chargesEnabled;
  const isPending = status?.connected && !status.chargesEnabled;

  return (
    <Card>
      <CardHeader
        title="Online payments"
        description="Connect Stripe so clients can pay invoices by card from the share link."
        ruled
      />

      {isLoading ? (
        <Skeleton className="h-20 rounded-lg" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-subtle text-ink-600">
              <CreditCard size={18} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-medium text-ink-900">Stripe</p>
              <p className="text-caption text-ink-400">
                {isActive
                  ? 'Accepting payments. Payouts go to your connected bank account.'
                  : isPending
                    ? 'Onboarding started — finish setup to start accepting payments.'
                    : 'Not connected yet.'}
              </p>
            </div>
            {isActive ? (
              <Badge tone="success" size="sm">
                Active
              </Badge>
            ) : isPending ? (
              <Badge tone="warning" size="sm">
                Pending
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                Not connected
              </Badge>
            )}
          </div>

          {isActive && !status?.payoutsEnabled && (
            <p className="text-caption text-warning-600">
              Payouts are not enabled yet. Complete any remaining requirements in Stripe to
              receive funds.
            </p>
          )}

          <Button
            variant={isActive ? 'outline' : 'primary'}
            leftIcon={<ExternalLink size={15} />}
            isLoading={startOnboarding.isPending}
            onClick={handleConnect}
          >
            {isActive ? 'Manage on Stripe' : isPending ? 'Continue setup' : 'Connect Stripe'}
          </Button>
        </div>
      )}
    </Card>
  );
}
