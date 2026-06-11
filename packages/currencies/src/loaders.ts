import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ICurrency } from './types.js';

let _cache: ICurrency[] | null = null;

async function load(): Promise<ICurrency[]> {
  if (_cache) return _cache;
  const dir = dirname(fileURLToPath(import.meta.url));
  _cache = JSON.parse(readFileSync(join(dir, 'data', 'currencies.json'), 'utf-8')) as ICurrency[];
  return _cache;
}

/** Returns all currencies. */
export async function getCurrencies(): Promise<ICurrency[]> {
  return load();
}

/** Returns a currency by its ISO 4217 code (e.g. "USD"), or undefined if not found. */
export async function getCurrencyByCode(code: string): Promise<ICurrency | undefined> {
  const currencies = await load();
  return currencies.find((c) => c.code === code.toUpperCase());
}

/** Returns all currencies used in a given country (ISO 3166-1 alpha-2 code, e.g. "US"). */
export async function getCurrenciesByCountry(countryCode: string): Promise<ICurrency[]> {
  const currencies = await load();
  const upper = countryCode.toUpperCase();
  return currencies.filter((c) => c.countries.includes(upper));
}

/** Returns true if the given string is a valid ISO 4217 currency code. */
export async function isValidCurrencyCode(code: string): Promise<boolean> {
  return (await getCurrencyByCode(code)) !== undefined;
}

/** Returns currencies whose name or code contains the given query (case-insensitive). */
export async function searchCurrencies(query: string): Promise<ICurrency[]> {
  const currencies = await load();
  const lower = query.toLowerCase();
  return currencies.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.namePlural.toLowerCase().includes(lower) ||
      c.code.toLowerCase().includes(lower),
  );
}
