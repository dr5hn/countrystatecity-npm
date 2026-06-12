import { getPhonecodeByCountry } from './loaders.js';

/** Returns the dial code string for a country ISO2 (e.g. "IN" → "+91"), or undefined. */
export async function getDialCode(iso2: string): Promise<string | undefined> {
  return (await getPhonecodeByCountry(iso2))?.dialCode;
}

/** Returns the raw phonecode for a country ISO2 (e.g. "IN" → "91"), or undefined. */
export async function getPhonecode(iso2: string): Promise<string | undefined> {
  return (await getPhonecodeByCountry(iso2))?.phonecode;
}

/**
 * Formats a local number with the country dial code.
 * e.g. formatWithDialCode("9876543210", "IN") → "+91 9876543210"
 */
export async function formatWithDialCode(localNumber: string, iso2: string): Promise<string> {
  const entry = await getPhonecodeByCountry(iso2);
  if (!entry) return localNumber;
  return `${entry.dialCode} ${localNumber}`;
}
