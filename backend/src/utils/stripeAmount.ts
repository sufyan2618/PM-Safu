// Zero-decimal currencies are billed in whole units (no *100). Extend this list if
// you enable more such currencies in Stripe.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY", "KRW", "VND", "CLP", "BIF", "DJF", "GNF", "PYG", "RWF", "UGX", "VUV", "XAF", "XOF", "XPF",
]);

function isZeroDecimal(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase());
}

/** Convert a human amount (e.g. 49.99) into Stripe's smallest-unit integer. */
export function toStripeAmount(amount: number, currency: string): number {
  return isZeroDecimal(currency) ? Math.round(amount) : Math.round(amount * 100);
}

/** Convert a Stripe smallest-unit integer back into a human amount. */
export function fromStripeAmount(amount: number, currency: string): number {
  return isZeroDecimal(currency) ? amount : Math.round(amount) / 100;
}
