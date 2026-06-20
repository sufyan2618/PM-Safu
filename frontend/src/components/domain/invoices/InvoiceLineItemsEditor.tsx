import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useDescribeItem } from '@/hooks/queries/useAi';
import { aiErrorMessage } from '@/api/services/ai.service';
import { useToast } from '@/hooks/useToast';
import type { InvoiceFormValues } from '@/constants/validation.constants';
import type { TaxRate } from '@/types';

interface InvoiceLineItemsEditorProps {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  setValue?: UseFormSetValue<InvoiceFormValues>;
  taxRates?: TaxRate[];
  aiEnabled?: boolean;
  error?: string;
}

/** Description input with an optional AI button that expands a short item name into a polished line. */
function DescriptionCell({
  control,
  register,
  setValue,
  index,
  aiEnabled,
}: {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  setValue?: UseFormSetValue<InvoiceFormValues>;
  index: number;
  aiEnabled: boolean;
}) {
  const toast = useToast();
  const describe = useDescribeItem();
  const description = useWatch({ control, name: `lineItems.${index}.description` });
  const quantity = useWatch({ control, name: `lineItems.${index}.quantity` });

  async function handleDescribe() {
    if (!description || description.trim().length < 2) {
      toast.info('Type a short item name first, then let AI expand it.');
      return;
    }
    try {
      const text = await describe.mutateAsync({
        name: description,
        hours: typeof quantity === 'number' && quantity > 0 ? quantity : undefined,
      });
      setValue?.(`lineItems.${index}.description`, text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (err) {
      toast.error(aiErrorMessage(err));
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        {...register(`lineItems.${index}.description`)}
        placeholder="Service or product"
        className="w-full rounded-md bg-transparent px-2 py-1.5 text-body-sm text-ink-900 placeholder:text-ink-400 focus:bg-sunken focus:outline-none"
      />
      {aiEnabled && setValue && (
        <IconButton
          label="Write description with AI"
          size="sm"
          icon={
            describe.isPending ? (
              <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <Sparkles size={15} strokeWidth={1.5} />
            )
          }
          onClick={handleDescribe}
          disabled={describe.isPending}
        />
      )}
    </div>
  );
}

export function InvoiceLineItemsEditor({
  control,
  register,
  setValue,
  taxRates,
  aiEnabled = false,
  error,
}: InvoiceLineItemsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const hasTaxRates = !!setValue && !!taxRates && taxRates.length > 0;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-subtle">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-subtle bg-sunken text-caption uppercase tracking-[0.02em] text-ink-600">
              <th className="px-3 py-2.5 text-left font-medium">Description</th>
              <th className="w-20 px-3 py-2.5 text-right font-medium">Qty</th>
              <th className="w-28 px-3 py-2.5 text-right font-medium">Unit price</th>
              <th className={`${hasTaxRates ? 'w-44' : 'w-20'} px-3 py-2.5 text-right font-medium`}>
                Tax %
              </th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-subtle last:border-0">
                <td className="px-2 py-1.5">
                  <DescriptionCell
                    control={control}
                    register={register}
                    setValue={setValue}
                    index={index}
                    aiEnabled={aiEnabled}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="1"
                    {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-right font-data text-body-sm text-ink-900 focus:bg-sunken focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-right font-data text-body-sm text-ink-900 focus:bg-sunken focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center justify-end gap-1.5">
                    {hasTaxRates && (
                      <select
                        aria-label="Apply saved tax rate"
                        defaultValue=""
                        onChange={(e) => {
                          const rate = Number(e.target.value);
                          if (!Number.isNaN(rate)) {
                            setValue!(`lineItems.${index}.taxRate`, rate, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                          e.target.value = '';
                        }}
                        className="w-24 rounded-md bg-sunken px-1.5 py-1.5 text-caption text-ink-600 focus:outline-none"
                      >
                        <option value="">Code…</option>
                        {taxRates!.map((t) => (
                          <option key={t.id} value={t.rate}>
                            {t.name} ({t.rate}%)
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="number"
                      step="0.5"
                      {...register(`lineItems.${index}.taxRate`, { valueAsNumber: true })}
                      className="w-16 rounded-md bg-transparent px-2 py-1.5 text-right font-data text-body-sm text-ink-900 focus:bg-sunken focus:outline-none"
                    />
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <IconButton
                    label="Remove line"
                    size="sm"
                    icon={<Trash2 size={15} strokeWidth={1.5} />}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-1.5 text-caption text-danger-600">{error}</p>}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        leftIcon={<Plus size={15} />}
        className="mt-3"
        onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 0 })}
      >
        Add line item
      </Button>
    </div>
  );
}
