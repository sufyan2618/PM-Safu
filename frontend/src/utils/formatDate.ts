import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

function toDate(value: string | Date): Date | null {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/** Default ledger date format, e.g. "20 Jun 2026". */
export function formatDate(value: string | Date, pattern = 'dd MMM yyyy'): string {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
}

export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return date ? format(date, 'dd MMM yyyy, HH:mm') : '—';
}

export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '—';
}

/** "2026-06" -> "June 2026" */
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  const date = new Date(year, month - 1, 1);
  return isValid(date) ? format(date, 'MMMM yyyy') : period;
}
