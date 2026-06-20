import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { Skeleton } from '@/components/ui/Skeleton';
import { TaxRatesCard } from '@/components/domain/settings/TaxRatesCard';
import { PayrollTaxCard } from '@/components/domain/settings/PayrollTaxCard';
import { useCompany, useUpdateCompany } from '@/hooks/queries/useCompany';
import { companyService } from '@/api/services/company.service';
import { useToast } from '@/hooks/useToast';
import { CURRENCY_OPTIONS } from '@/constants/currency.constants';
import {
  companySettingsSchema,
  type CompanySettingsFormValues,
} from '@/constants/validation.constants';

export function CompanySettingsPage() {
  const toast = useToast();
  const { data: company, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: { companyName: '', currency: 'USD', invoicePrefix: 'INV' },
  });
  const currency = useWatch({ control, name: 'currency' });

  useEffect(() => {
    if (company) {
      reset({
        companyName: company.legalName ?? company.companyName,
        address: [company.address?.line1, company.address?.city, company.address?.country]
          .filter(Boolean)
          .join(', '),
        taxId: company.taxId ?? '',
        currency: company.currency,
        invoicePrefix: company.invoiceSettings?.prefix ?? 'INV',
      });
    }
  }, [company, reset]);

  async function onSubmit(values: CompanySettingsFormValues) {
    try {
      await updateCompany.mutateAsync({
        legalName: values.companyName,
        taxId: values.taxId || undefined,
        currency: values.currency,
        address: values.address ? { line1: values.address } : undefined,
      });
      if (values.invoicePrefix) {
        await companyService.updateInvoiceSettings({ prefix: values.invoicePrefix });
      }
      toast.success('Company settings saved');
    } catch {
      toast.error('Could not save settings');
    }
  }

  async function handleLogo(files: File[]) {
    if (!files[0]) return;
    try {
      await companyService.uploadLogo(files[0]);
      toast.success('Logo uploaded');
    } catch {
      toast.error('Logo upload failed');
    }
  }

  return (
    <>
      <PageHeader title="Company" description="Manage your company profile and preferences." />

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Company profile" ruled />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Company name"
                errorText={errors.companyName?.message}
                {...register('companyName')}
              />
              <Textarea label="Address" rows={2} {...register('address')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Tax ID" {...register('taxId')} />
                <Select
                  label="Default currency"
                  value={currency}
                  onChange={(v) => setValue('currency', v as string)}
                  options={CURRENCY_OPTIONS}
                  errorText={errors.currency?.message}
                />
              </div>
              <Input
                label="Invoice prefix"
                helperText="e.g. INV → INV-0001"
                {...register('invoicePrefix')}
              />
              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting || updateCompany.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Company logo" ruled />
              <FileUpload
                accept="image/png,image/jpeg,image/svg+xml"
                preview="image"
                label="Upload logo"
                hint="Appears on invoices & payslips"
                onFilesSelected={handleLogo}
              />
            </Card>

            <TaxRatesCard />

            <PayrollTaxCard />
          </div>
        </div>
      )}
    </>
  );
}
