import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { AiBadge, AiDisclaimer } from '@/components/domain/shared/AiBadge';
import { usePayrollChat } from '@/hooks/queries/useAi';
import { aiErrorMessage } from '@/api/services/ai.service';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';
import type { AiChatMessage } from '@/types';

interface PayrollChatDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the assistant focuses on this run; otherwise it uses the latest run. */
  payrollId?: string;
}

const SUGGESTIONS = [
  'Why did payroll change this month?',
  'Which department costs the most?',
  'How has headcount changed recently?',
];

export function PayrollChatDrawer({ open, onClose, payrollId }: PayrollChatDrawerProps) {
  const toast = useToast();
  const chat = usePayrollChat();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat.isPending]);

  async function ask(text: string) {
    const content = text.trim();
    if (!content || chat.isPending) return;
    const next: AiChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    try {
      const reply = await chat.mutateAsync({ messages: next, payrollId });
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      toast.error(aiErrorMessage(err));
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title="Payroll AI Copilot"
      description="Ask questions about your recent payroll runs."
    >
      <div className="flex h-full flex-col">
        <div className="mb-3 flex items-center gap-2">
          <AiBadge />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-body-sm text-ink-600">
                Try one of these, or ask your own question:
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-lg border border-subtle px-3 py-2 text-left text-body-sm text-ink-900 transition-colors hover:bg-sunken"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-body-sm',
                  m.role === 'user'
                    ? 'bg-accent-600 text-white'
                    : 'border border-subtle bg-sunken text-ink-900',
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {chat.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-subtle bg-sunken px-3.5 py-2 text-body-sm text-ink-600">
                <Sparkles size={14} strokeWidth={1.5} className="animate-pulse" />
                Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-3 shrink-0 border-t border-subtle pt-3">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void ask(input);
                }
              }}
              placeholder="Ask about payroll…"
              className="max-h-32 min-h-[40px] w-full resize-none rounded-lg border border-strong bg-surface px-3 py-2 text-body-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-600 focus:outline-none focus:ring-1 focus:ring-accent-600"
            />
            <Button
              type="submit"
              leftIcon={<Send size={16} />}
              isLoading={chat.isPending}
              disabled={!input.trim()}
            >
              Send
            </Button>
          </form>
          <AiDisclaimer className="mt-2" />
        </div>
      </div>
    </Drawer>
  );
}
