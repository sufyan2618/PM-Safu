import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsNav } from './SettingsNav';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/hooks/useToast';
import { CURRENCY_OPTIONS } from '@/constants/currency.constants';
import {
  companySettingsSchema,
  type CompanySettingsFormValues,
} from '@/constants/validation.constants';

export function CompanySettingsPage() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      companyName: 'Northwind Trading Co.',
      address: '123 Market Street, San Francisco, CA',
      taxId: 'US-TAX-49021',
      currency: 'USD',
      invoicePrefix: 'INV',
    },
  });

  function onSubmit(_values: CompanySettingsFormValues) {
    toast.success('Company settings saved');
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and company preferences." />
      <SettingsNav />

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
                value={watch('currency')}
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
              <Button type="submit" isLoading={isSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Company logo" ruled />
          <FileUpload
            accept="image/png,image/jpeg,image/svg+xml"
            preview="image"
            label="Upload logo"
            hint="Appears on invoices & payslips"
            onFilesSelected={() => toast.success('Logo uploaded')}
          />
        </Card>
      </div>
    </>
  );
}
