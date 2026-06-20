import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  side?: 'right' | 'left';
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  side = 'right',
  width = 440,
  footer,
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ width }}
            className={cn(
              'absolute inset-y-0 flex max-w-full flex-col bg-surface shadow-popover',
              side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              'border-subtle',
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-subtle px-5 py-4">
                <div className="min-w-0">
                  {title && <h2 className="text-display-sm text-ink-900">{title}</h2>}
                  {description && <p className="mt-1 text-body-sm text-ink-600">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="shrink-0 rounded-lg p-1 text-ink-400 transition-colors hover:bg-sunken hover:text-ink-900"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-subtle px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
