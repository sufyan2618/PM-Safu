import { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { AiBadge, AiDisclaimer } from '@/components/domain/shared/AiBadge';
import { useInvoiceDraft } from '@/hooks/queries/useAi';
import { aiErrorMessage } from '@/api/services/ai.service';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/utils/formatCurrency';
import type { AiInvoiceDraft, AiInvoiceDraftResponse } from '@/types';

interface ClientOption {
  id: string;
  name: string;
  companyName?: string;
}

interface AiInvoiceAssistantProps {
  open: boolean;
  onClose: () => void;
  clients: ClientOption[];
  onApply: (draft: AiInvoiceDraft) => void;
}

const EXAMPLE = `Invoice Acme Corp for 3 React developers, 160 hours each at $25/hour. Add 10% VAT. Payment due in 15 days.`;

export function AiInvoiceAssistant({ open, onClose, clients, onApply }: AiInvoiceAssistantProps) {
  const toast = useToast();
  const draft = useInvoiceDraft();
  const [prompt, setPrompt] = useState('');
  const [answers, setAnswers] = useState<{ clientId?: string; dueDate?: string }>({});
  const [result, setResult] = useState<AiInvoiceDraftResponse | null>(null);

  async function runDraft(nextAnswers: { clientId?: string; dueDate?: string }) {
    try {
      const res = await draft.mutateAsync({ prompt, ...nextAnswers });
      setResult(res);
    } catch (err) {
      toast.error(aiErrorMessage(err));
    }
  }

  function handleGenerate() {
    if (prompt.trim().length < 3) {
      toast.info('Describe the invoice you want to create.');
      return;
    }
    setAnswers({});
    setResult(null);
    void runDraft({});
  }

  function answerClient(clientId: string) {
    const next = { ...answers, clientId };
    setAnswers(next);
    void runDraft(next);
  }

  function handleApply() {
    if (!result) return;
    onApply(result.draft);
    toast.success('AI draft applied — review and save when ready.');
    reset();
    onClose();
  }

  function reset() {
    setResult(null);
    setAnswers({});
  }

  const draftData = result?.draft;
  const hasItems = (draftData?.items.length ?? 0) > 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title="AI Invoice Assistant"
      description="Describe the invoice in plain English and let AI draft it for you."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {result && (
            <Button leftIcon={<Wand2 size={16} />} onClick={handleApply} disabled={!draftData}>
              Apply to form
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <AiBadge label="Powered by AI" />
        </div>

        <div>
          <Textarea
            label="Describe the invoice"
            rows={5}
            placeholder={EXAMPLE}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="button"
            className="mt-1.5 text-caption text-accent-600 hover:underline"
            onClick={() => setPrompt(EXAMPLE)}
          >
            Use an example
          </button>
        </div>

        <Button
          leftIcon={<Sparkles size={16} />}
          isLoading={draft.isPending}
          onClick={handleGenerate}
          className="w-full"
        >
          {result ? 'Regenerate' : 'Generate draft'}
        </Button>

        {result && (
          <div className="space-y-4 border-t border-subtle pt-4">
            {/* Clarifying questions */}
            {result.questions.map((q) => (
              <div key={q.id} className="rounded-lg border border-subtle bg-sunken/50 p-3">
                <p className="mb-2 text-body-sm font-medium text-ink-900">{q.prompt}</p>

                {q.type === 'client_disambiguation' && q.options && (
                  <RadioGroup
                    name={`q-${q.id}`}
                    value={answers.clientId ?? ''}
                    onChange={(v) => answerClient(v)}
                    options={q.options.map((o) => ({
                      value: o.id,
                      label: o.description ? `${o.label} · ${o.description}` : o.label,
                    }))}
                  />
                )}

                {q.type === 'client_select' && (
                  <Select
                    searchable
                    placeholder="Select a client"
                    value={answers.clientId ?? ''}
                    onChange={(v) => answerClient(v as string)}
                    options={clients.map((c) => ({
                      label: c.name,
                      value: c.id,
                      description: c.companyName,
                    }))}
                  />
                )}

                {q.type === 'items' && (
                  <p className="text-caption text-ink-400">
                    Edit your description above to include the service, quantity and price, then
                    regenerate.
                  </p>
                )}
              </div>
            ))}

            {/* Draft preview */}
            {draftData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-caption font-medium uppercase tracking-[0.02em] text-ink-600">
                    Draft preview
                  </h3>
                  {result.status === 'ready' ? (
                    <span className="text-caption text-success-600">Ready to apply</span>
                  ) : (
                    <span className="text-caption text-warn-600">Needs a couple of answers</span>
                  )}
                </div>

                <dl className="space-y-1.5 rounded-lg border border-subtle p-3 text-body-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Client</dt>
                    <dd className="text-ink-900">{draftData.clientName ?? 'Not selected'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Due date</dt>
                    <dd className="font-data text-ink-900">{draftData.dueDate ?? '—'}</dd>
                  </div>
                </dl>

                {hasItems && (
                  <div className="overflow-hidden rounded-lg border border-subtle">
                    <table className="w-full text-body-sm">
                      <thead>
                        <tr className="border-b border-subtle bg-sunken text-caption uppercase text-ink-600">
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          <th className="px-3 py-2 text-right font-medium">Price</th>
                          <th className="px-3 py-2 text-right font-medium">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftData.items.map((item, i) => (
                          <tr key={i} className="border-b border-subtle last:border-0">
                            <td className="px-3 py-2 text-ink-900">{item.description}</td>
                            <td className="px-3 py-2 text-right font-data">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-data">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-right font-data">{item.taxRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <AiDisclaimer />
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
