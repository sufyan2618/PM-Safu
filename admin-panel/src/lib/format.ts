const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  PKR: '₨',
  INR: '₹',
  AED: 'د.إ',
  SAR: '﷼',
};

/** Format a numeric amount as a currency string (ledger look). */
export function formatCurrency(value: number, currency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${value < 0 ? '-' : ''}${symbol}${formatted}`;
}

/** Compact large numbers for stat tiles, e.g. 12500 -> $12.5K. */
export function formatCompactCurrency(value: number, currency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
  return `${symbol}${formatted}`;
}

/** Compact integer counts, e.g. 1500 -> 1.5K. */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format an ISO date string as e.g. "Jun 20, 2026". */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/** Format an ISO date string with time, e.g. "Jun 20, 2026, 1:57 PM". */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Relative time, e.g. "3 days ago". Falls back to absolute for older dates. */
export function formatRelative(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return formatDate(value);
}
