import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY } from '@/constants/currency.constants';

interface FormatCurrencyOptions {
  currency?: string;
  /** Hide the decimal portion for whole-number heavy views. */
  compact?: boolean;
  /** Show a leading +/- sign explicitly. */
  signed?: boolean;
}

/**
 * Format a numeric amount as a currency string.
 * Always render the result in `font-data` for the ledger look.
 */
export function formatCurrency(
  value: number,
  { currency = DEFAULT_CURRENCY, compact = false, signed = false }: FormatCurrencyOptions = {},
): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const abs = Math.abs(value);

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  }).format(abs);

  const sign = value < 0 ? '-' : signed ? '+' : '';
  return `${sign}${symbol}${formatted}`;
}

/** Compact large numbers, e.g. 12500 -> $12.5K, used for stat tiles. */
export function formatCompactCurrency(value: number, currency = DEFAULT_CURRENCY): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
  return `${symbol}${formatted}`;
}
