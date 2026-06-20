export const DEFAULT_CURRENCY = 'USD';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: '₨',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  INR: '₹',
};

export const CURRENCY_OPTIONS = Object.keys(CURRENCY_SYMBOLS).map((code) => ({
  label: `${code} (${CURRENCY_SYMBOLS[code]})`,
  value: code,
}));
