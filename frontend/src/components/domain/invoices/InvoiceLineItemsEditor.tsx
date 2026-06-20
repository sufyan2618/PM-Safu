import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import type { InvoiceFormValues } from '@/constants/validation.constants';

interface InvoiceLineItemsEditorProps {
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  error?: string;
}

export function InvoiceLineItemsEditor({ control, register, error }: InvoiceLineItemsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-subtle">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-subtle bg-sunken text-caption uppercase tracking-[0.02em] text-ink-600">
              <th className="px-3 py-2.5 text-left font-medium">Description</th>
              <th className="w-20 px-3 py-2.5 text-right font-medium">Qty</th>
              <th className="w-28 px-3 py-2.5 text-right font-medium">Unit price</th>
              <th className="w-20 px-3 py-2.5 text-right font-medium">Tax %</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-subtle last:border-0">
                <td className="px-2 py-1.5">
                  <input
                    {...register(`lineItems.${index}.description`)}
                    placeholder="Service or product"
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-body-sm text-ink-900 placeholder:text-ink-400 focus:bg-sunken focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="1"
                    {...register(`lineItems.${index}.quantity`)}
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-right font-data text-body-sm text-ink-900 focus:bg-sunken focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`lineItems.${index}.unitPrice`)}
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-right font-data text-body-sm text-ink-900 focus:bg-sunken focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.5"
                    {...register(`lineItems.${index}.taxRate`)}
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-right font-data text-body-sm text-ink-900 focus:bg-sunken focus:outline-none"
                  />
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
