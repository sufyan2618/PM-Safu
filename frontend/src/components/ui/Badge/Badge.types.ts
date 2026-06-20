import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Outlined by default per the ledger design language. */
  outlined?: boolean;
  dot?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}
