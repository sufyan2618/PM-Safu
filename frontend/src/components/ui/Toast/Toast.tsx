import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useToastStore, type ToastTone } from './toast.store';
import { cn } from '@/utils/cn';

const TONE_CONFIG: Record<
  ToastTone,
  { icon: typeof Info; iconClass: string; barClass: string }
> = {
  success: { icon: CheckCircle2, iconClass: 'text-success-600', barClass: 'bg-success-600' },
  error: { icon: XCircle, iconClass: 'text-danger-600', barClass: 'bg-danger-600' },
  warning: { icon: AlertTriangle, iconClass: 'text-warn-600', barClass: 'bg-warn-600' },
  info: { icon: Info, iconClass: 'text-info-600', barClass: 'bg-info-600' },
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const config = TONE_CONFIG[toast.tone];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-subtle bg-surface p-4 shadow-popover"
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', config.barClass)} />
              <Icon size={18} strokeWidth={1.5} className={cn('mt-0.5 shrink-0', config.iconClass)} />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-ink-900">{toast.message}</p>
                {toast.description && (
                  <p className="mt-0.5 text-caption text-ink-600">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded text-ink-400 transition-colors hover:text-ink-900"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
