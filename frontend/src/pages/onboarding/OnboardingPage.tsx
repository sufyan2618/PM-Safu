import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, ImagePlus, X } from 'lucide-react';
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

  const [logoUrl, setLogoUrl] = useState<string | undefined>(company?.logoUrl);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(company?.logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);

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

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Logo must be under 5 MB.');
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    try {
      const result = await companyService.uploadLogo(file);
      setLogoUrl(result.logoUrl);
      toast.success('Logo uploaded');
    } catch {
      toast.error('Upload failed', 'Could not upload logo. Please try again.');
      setLogoPreview(undefined);
    } finally {
      setLogoUploading(false);
    }
  }

  async function onSubmit(values: OnboardingFormValues) {
    if (!logoUrl) {
      toast.error('Logo required', 'Please upload your company logo before continuing.');
      return;
    }
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
          {/* Logo upload — required */}
          <Card>
            <CardHeader
              title="Company logo"
              description="Used on invoices, salary slips and your dashboard. Required."
              ruled
            />
            <div className="flex items-start gap-5">
              <label className="group relative flex-shrink-0 cursor-pointer">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-strong bg-sunken transition-colors hover:border-accent-600 hover:bg-accent-100">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      <ImagePlus size={22} className="text-ink-400" strokeWidth={1.5} />
                      <span className="text-[10px] text-ink-400">Upload</span>
                    </span>
                  )}
                  {logoUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="sr-only"
                  onChange={handleLogoSelect}
                />
              </label>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-body-sm font-medium text-ink-900">
                  {logoUrl ? 'Logo uploaded' : 'No logo yet'}
                </p>
                <p className="mt-0.5 text-caption text-ink-400">
                  PNG, JPG, SVG or WEBP · up to 5 MB · recommended 400×400 px
                </p>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(undefined); setLogoPreview(undefined); }}
                    className="mt-2 inline-flex items-center gap-1 text-caption text-danger-600 hover:underline"
                  >
                    <X size={12} /> Remove
                  </button>
                )}
                {!logoUrl && (
                  <p className="mt-2 text-caption font-medium text-danger-600">
                    Logo is required to complete setup
                  </p>
                )}
              </div>
            </div>
          </Card>

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

          <div className="flex items-center justify-end gap-3 pt-2">
            {!logoUrl && (
              <p className="text-caption text-ink-400">Upload a logo to continue</p>
            )}
            <Button
              type="submit"
              size="lg"
              leftIcon={<Check size={16} />}
              isLoading={isSubmitting || logoUploading}
              disabled={!logoUrl}
            >
              Complete setup
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
