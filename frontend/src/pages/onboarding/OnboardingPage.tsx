import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Building2, Check } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { companyService } from '@/api/services/company.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { CURRENCY_OPTIONS } from '@/constants/currency.constants';
import { ROUTES } from '@/constants/routes.constants';
import { onboardingSchema, type OnboardingFormValues } from '@/constants/validation.constants';

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((label, i) => ({ label, value: String(i + 1) }));

export function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const company = useAuthStore((s) => s.company);
  const setCompany = useAuthStore((s) => s.setCompany);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      legalName: company?.companyName ?? '',
      currency: company?.currency ?? 'USD',
      fiscalYearStartMonth: 1,
    },
  });

  const currency = useWatch({ control, name: 'currency' });
  const fiscalMonth = useWatch({ control, name: 'fiscalYearStartMonth' });

  async function onSubmit(values: OnboardingFormValues) {
    try {
      const updated = await companyService.setup({
        legalName: values.legalName,
        industry: values.industry || undefined,
        brandColor: values.brandColor || undefined,
        address: {
          line1: values.line1 || undefined,
          city: values.city,
          state: values.state || undefined,
          postalCode: values.postalCode || undefined,
          country: values.country,
        },
        phone: values.phone || undefined,
        website: values.website || undefined,
        taxId: values.taxId || undefined,
        currency: values.currency,
        fiscalYearStartMonth: values.fiscalYearStartMonth,
        completeOnboarding: true,
      });
      setCompany({
        id: updated.id,
        companyName: updated.companyName,
        status: updated.status,
        isActive: updated.isActive,
        onboardingCompleted: updated.onboardingCompleted,
        currency: updated.currency,
        logoUrl: updated.logoUrl,
      });
      toast.success('Workspace ready', 'Your company is all set up.');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      toast.error('Could not complete setup', 'Please review the details and try again.');
    }
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-subtle bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Brand />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
            <Building2 size={22} strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-display-sm text-ink-900">Set up your company</h1>
            <p className="mt-1 text-body-sm text-ink-600">
              A few details to personalize invoices, payroll and reports. You can change these later
              in settings.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Card>
            <CardHeader title="Company profile" ruled />
            <div className="space-y-4">
              <Input
                label="Legal name"
                placeholder="Northwind Trading Co. Ltd."
                errorText={errors.legalName?.message}
                {...register('legalName')}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Industry" placeholder="e.g. Software" {...register('industry')} />
                <Input label="Tax ID" placeholder="Optional" {...register('taxId')} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Phone" placeholder="Optional" {...register('phone')} />
                <Input
                  label="Website"
                  placeholder="https://example.com"
                  errorText={errors.website?.message}
                  {...register('website')}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Address" ruled />
            <div className="space-y-4">
              <Input label="Street address" placeholder="Optional" {...register('line1')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="City" errorText={errors.city?.message} {...register('city')} />
                <Input label="State / Province" {...register('state')} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Postal code" {...register('postalCode')} />
                <Input label="Country" errorText={errors.country?.message} {...register('country')} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Finance preferences" ruled />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Default currency"
                value={currency}
                onChange={(v) => setValue('currency', v as string, { shouldValidate: true })}
                options={CURRENCY_OPTIONS}
                errorText={errors.currency?.message}
              />
              <Select
                label="Fiscal year starts"
                value={String(fiscalMonth)}
                onChange={(v) => setValue('fiscalYearStartMonth', Number(v), { shouldValidate: true })}
                options={MONTH_OPTIONS}
              />
            </div>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" leftIcon={<Check size={16} />} isLoading={isSubmitting}>
              Complete setup
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
