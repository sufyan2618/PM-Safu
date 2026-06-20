import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Save, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs } from '@/components/ui/Tabs';
import { InvoiceLineItemsEditor } from '@/components/domain/invoices/InvoiceLineItemsEditor';
import { InvoicePreviewPane } from '@/components/domain/invoices/InvoicePreviewPane';
import { useClients } from '@/hooks/queries/useClients';
import { useCreateInvoice, useInvoiceTemplates } from '@/hooks/queries/useInvoices';
import { useToast } from '@/hooks/useToast';
import { invoiceSchema, type InvoiceFormValues } from '@/constants/validation.constants';
import { ROUTES } from '@/constants/routes.constants';

const todayIso = new Date().toISOString().slice(0, 10);
const dueIso = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

export function InvoiceCreatePage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  const clients = useClients({ pageSize: 100 });
  const templates = useInvoiceTemplates();
  const createInvoice = useCreateInvoice();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: '',
      issueDate: todayIso,
      dueDate: dueIso,
      templateId: '',
      notes: 'Thank you for your business.',
      terms: 'Payment due within 14 days.',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }],
    },
  });

  const values = useWatch({ control }) as InvoiceFormValues;
  const selectedClient = clients.data?.items.find((c) => c.id === values.clientId);
  const selectedTemplate = templates.data?.find((t) => t.id === values.templateId) ?? null;

  async function onSubmit(formValues: InvoiceFormValues) {
    try {
      await createInvoice.mutateAsync(formValues);
      toast.success(isEdit ? 'Invoice updated' : 'Invoice created');
      navigate(ROUTES.INVOICES);
    } catch {
      toast.error('Could not save invoice');
    }
  }

  const formColumn = (
    <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader title="Details" ruled />
        <div className="space-y-4">
          <Select
            label="Client"
            searchable
            placeholder="Select a client"
            value={values.clientId}
            onChange={(v) => setValue('clientId', v as string, { shouldValidate: true })}
            options={(clients.data?.items ?? []).map((c) => ({
              label: c.name,
              value: c.id,
              description: c.companyName,
            }))}
            errorText={errors.clientId?.message}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker label="Issue date" errorText={errors.issueDate?.message} {...register('issueDate')} />
            <DatePicker label="Due date" errorText={errors.dueDate?.message} {...register('dueDate')} />
          </div>
          <Select
            label="Template"
            value={values.templateId}
            onChange={(v) => setValue('templateId', v as string, { shouldValidate: true })}
            options={(templates.data ?? []).map((t) => ({ label: t.name, value: t.id }))}
            errorText={errors.templateId?.message}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Line items" ruled />
        <InvoiceLineItemsEditor
          control={control}
          register={register}
          error={errors.lineItems?.message}
        />
      </Card>

      <Card>
        <CardHeader title="Notes & terms" ruled />
        <div className="space-y-4">
          <Textarea label="Notes" rows={2} {...register('notes')} />
          <Textarea label="Terms & conditions" rows={2} {...register('terms')} />
        </div>
      </Card>
    </form>
  );

  const previewColumn = (
    <div className="lg:sticky lg:top-6">
      <InvoicePreviewPane
        client={selectedClient}
        issueDate={values.issueDate}
        dueDate={values.dueDate}
        lineItems={values.lineItems}
        notes={values.notes}
        terms={values.terms}
        template={selectedTemplate}
      />
    </div>
  );

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit invoice' : 'New invoice'}
        breadcrumbs={[{ label: 'Invoices', to: ROUTES.INVOICES }, { label: isEdit ? 'Edit' : 'New' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(ROUTES.INVOICES)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="invoice-form"
              leftIcon={<Save size={16} />}
              isLoading={isSubmitting}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              form="invoice-form"
              variant="secondary"
              leftIcon={<Send size={16} />}
              isLoading={isSubmitting}
            >
              Save & send
            </Button>
          </>
        }
      />

      {/* Mobile tab switch */}
      <div className="mb-4 lg:hidden">
        <Tabs
          tabs={[
            { label: 'Edit', value: 'edit' },
            { label: 'Preview', value: 'preview' },
          ]}
          value={mobileTab}
          onChange={(v) => setMobileTab(v as 'edit' | 'preview')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={mobileTab === 'edit' ? 'block' : 'hidden lg:block'}>{formColumn}</div>
        <div className={mobileTab === 'preview' ? 'block' : 'hidden lg:block'}>
          <div className="mb-2 hidden items-center gap-1.5 text-caption text-ink-400 lg:flex">
            <Eye size={13} strokeWidth={1.5} /> Live preview
          </div>
          {previewColumn}
        </div>
      </div>
    </>
  );
}
