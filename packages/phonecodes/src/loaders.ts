import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IPhonecode } from './types.js';

let _cache: IPhonecode[] | null = null;

async function load(): Promise<IPhonecode[]> {
  if (_cache) return _cache;
  const dir = dirname(fileURLToPath(import.meta.url));
  _cache = JSON.parse(readFileSync(join(dir, 'data', 'phonecodes.json'), 'utf-8')) as IPhonecode[];
  return _cache;
}

/** Returns all country phone codes sorted by ISO2. */
export async function getPhonecodes(): Promise<IPhonecode[]> {
  return load();
}

/** Returns the phone code entry for a country by ISO2 code (e.g. "IN"), or undefined. */
export async function getPhonecodeByCountry(iso2: string): Promise<IPhonecode | undefined> {
  const phonecodes = await load();
  return phonecodes.find((p) => p.iso2 === iso2.toUpperCase());
}

/** Returns all countries that share a given dial code (e.g. "+1" → US, CA, …). */
export async function getCountriesByDialCode(dialCode: string): Promise<IPhonecode[]> {
  const phonecodes = await load();
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return phonecodes.filter((p) => p.dialCode === normalized);
}

/** Returns true if the given dial code exists (e.g. "+91"). */
export async function isValidDialCode(dialCode: string): Promise<boolean> {
  return (await getCountriesByDialCode(dialCode)).length > 0;
}

/** Returns entries whose country name or dial code contains the query (case-insensitive). */
export async function searchPhonecodes(query: string): Promise<IPhonecode[]> {
  const phonecodes = await load();
  const lower = query.toLowerCase();
  return phonecodes.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.iso2.toLowerCase().includes(lower) ||
      p.dialCode.includes(lower) ||
      p.phonecode.includes(lower),
  );
}
