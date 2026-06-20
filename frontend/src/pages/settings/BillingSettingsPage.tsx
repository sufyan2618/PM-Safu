import { Check } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

const PLANS = [
  { name: 'Starter', price: 0, features: ['Up to 5 employees', '20 invoices / mo', 'Email support'] },
  {
    name: 'Growth',
    price: 49,
    features: ['Up to 50 employees', 'Unlimited invoices', 'Custom branding', 'Priority support'],
    current: true,
  },
  {
    name: 'Scale',
    price: 149,
    features: ['Unlimited employees', 'Multi-company', 'Advanced reports', 'SSO & audit log'],
  },
];

export function BillingSettingsPage() {
  return (
    <>
      <PageHeader title="Billing" description="Manage your subscription and payment details." />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-caption uppercase tracking-[0.02em] text-ink-400">Current plan</p>
            <p className="mt-1 text-heading text-ink-900">Growth — {formatCurrency(49)}/mo</p>
            <p className="text-body-sm text-ink-600">Next invoice on 1 Jul 2026</p>
          </div>
          <Button variant="outline">Manage billing</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader
              title={plan.name}
              action={plan.current ? <Badge tone="accent">Current</Badge> : undefined}
            />
            <p className="font-data text-display-sm text-ink-900">
              {formatCurrency(plan.price)}
              <span className="text-body-sm font-normal text-ink-400">/mo</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-body-sm text-ink-600">
                  <Check size={15} strokeWidth={2} className="text-accent-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.current ? 'secondary' : 'outline'}
              fullWidth
              className="mt-5"
              disabled={plan.current}
            >
              {plan.current ? 'Current plan' : 'Choose plan'}
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
