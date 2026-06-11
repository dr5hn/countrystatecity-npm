import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ICountryTranslation } from './types.js';

let _cache: ICountryTranslation[] | null = null;
let _map: Map<string, ICountryTranslation> | null = null;

async function load(): Promise<ICountryTranslation[]> {
  if (_cache) return _cache;
  const dir = dirname(fileURLToPath(import.meta.url));
  _cache = JSON.parse(readFileSync(join(dir, 'data', 'translations.json'), 'utf-8')) as ICountryTranslation[];
  _map = new Map(_cache.map((c) => [c.iso2.toUpperCase(), c]));
  return _cache;
}

function getMap(): Map<string, ICountryTranslation> {
  if (!_map) throw new Error('Translations not loaded yet — call getTranslations() first');
  return _map;
}

/** Returns all country translation records. */
export async function getTranslations(): Promise<ICountryTranslation[]> {
  return load();
}

/** Returns the translation record for a country by ISO 3166-1 alpha-2 code (e.g. "US"), or undefined if not found. */
export async function getCountryTranslations(iso2: string): Promise<ICountryTranslation | undefined> {
  await load();
  return getMap().get(iso2.toUpperCase());
}

/** Returns the translated name for a country in the given locale, or undefined if not found. */
export async function getTranslation(iso2: string, locale: string): Promise<string | undefined> {
  const entry = await getCountryTranslations(iso2);
  return entry?.translations[locale];
}

/** Returns all available locale codes (e.g. ["ar", "de", "es", ...]). */
export async function getLocales(): Promise<string[]> {
  const data = await load();
  if (data.length === 0) return [];
  return Object.keys(data[0].translations).sort();
}

/** Returns all country translation records whose name in the given locale matches the query (case-insensitive). If no locale is given, searches across all locales and the English name. */
export async function searchByTranslatedName(query: string, locale?: string): Promise<ICountryTranslation[]> {
  const data = await load();
  const lower = query.toLowerCase();

  return data.filter((entry) => {
    if (locale) {
      return entry.translations[locale]?.toLowerCase().includes(lower);
    }
    return (
      entry.name.toLowerCase().includes(lower) ||
      Object.values(entry.translations).some((t) => t.toLowerCase().includes(lower))
    );
  });
}
