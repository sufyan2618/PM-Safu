import { cn } from '@/utils/cn';
import type { BadgeProps, BadgeTone } from './Badge.types';

const TONE_CLASSES: Record<BadgeTone, { text: string; border: string; bg: string; dot: string }> = {
  neutral: { text: 'text-ink-600', border: 'border-strong', bg: 'bg-sunken', dot: 'bg-ink-400' },
  accent: {
    text: 'text-accent-600',
    border: 'border-accent-600/40',
    bg: 'bg-accent-100',
    dot: 'bg-accent-600',
  },
  success: {
    text: 'text-success-600',
    border: 'border-success-600/40',
    bg: 'bg-success-100',
    dot: 'bg-success-600',
  },
  warning: {
    text: 'text-warn-600',
    border: 'border-warn-600/40',
    bg: 'bg-warn-100',
    dot: 'bg-warn-600',
  },
  danger: {
    text: 'text-danger-600',
    border: 'border-danger-600/40',
    bg: 'bg-danger-100',
    dot: 'bg-danger-600',
  },
  info: { text: 'text-info-600', border: 'border-info-600/40', bg: 'bg-info-100', dot: 'bg-info-600' },
};

export function Badge({
  tone = 'neutral',
  outlined = true,
  dot = false,
  size = 'md',
  children,
  className,
}: BadgeProps) {
  const tones = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-caption' : 'px-2.5 py-1 text-caption',
        tones.text,
        outlined ? cn('border bg-transparent', tones.border) : tones.bg,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tones.dot)} />}
      {children}
    </span>
  );
}
