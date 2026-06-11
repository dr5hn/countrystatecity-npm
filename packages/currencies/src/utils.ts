import type { ICurrency } from './types.js';
import { getCurrencyByCode } from './loaders.js';

/** Returns the symbol for a currency code (e.g. "USD" → "$"), or undefined if not found. */
export async function getCurrencySymbol(code: string): Promise<string | undefined> {
  return (await getCurrencyByCode(code))?.symbol;
}

/** Returns the native symbol for a currency code (e.g. "INR" → "₹"), or undefined if not found. */
export async function getCurrencySymbolNative(code: string): Promise<string | undefined> {
  return (await getCurrencyByCode(code))?.symbolNative;
}

/** Returns a currency by its symbol (e.g. "$"), checking both symbol and symbolNative. */
export async function getCurrencyBySymbol(symbol: string): Promise<ICurrency | undefined> {
  const { getCurrencies } = await import('./loaders.js');
  const currencies = await getCurrencies();
  return currencies.find((c) => c.symbol === symbol || c.symbolNative === symbol);
}

/**
 * Formats a number as a currency string using the currency's symbol and decimal rules.
 * e.g. formatCurrencyAmount(1234.5, "USD") → "$1,234.50"
 */
export async function formatCurrencyAmount(amount: number, code: string): Promise<string> {
  const currency = await getCurrencyByCode(code);
  if (!currency) return String(amount);

  const fixed = amount.toFixed(currency.decimalDigits);
  const [integer, decimal] = fixed.split('.');
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decimal !== undefined
    ? `${currency.symbol}${formatted}.${decimal}`
    : `${currency.symbol}${formatted}`;
}
