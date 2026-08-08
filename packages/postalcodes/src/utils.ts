/**
 * Helper utilities for @countrystatecity/postalcodes
 */

import type { IPostalCode } from './types';
import {
  getManifest,
  getAllPostalCodesOfCountry,
  getPostalCodesOfState,
} from './loaders';

/**
 * Check whether a postal code exists in the dataset for a country.
 *
 * This is an EXISTENCE check, not a format/regex check — the upstream
 * database doesn't expose postal code format patterns through any versioned
 * release asset, only through a mutable, unversioned branch file that this
 * package deliberately avoids depending on. An existence check also catches
 * typos in otherwise-plausible codes that a format regex would miss.
 *
 * @param countryCode - ISO2 country code
 * @param code - The postal code to check
 * @param stateCode - Optional state code to narrow the search (faster)
 */
export async function validatePostalCode(
  countryCode: string,
  code: string,
  stateCode?: string
): Promise<boolean> {
  const matches = await lookupPostalCode(countryCode, code, stateCode);
  return matches.length > 0;
}

/**
 * Look up all records matching an exact postal code.
 * Never assumes uniqueness — the same code can legitimately appear more
 * than once within a country (different localities sharing a code).
 *
 * @param countryCode - ISO2 country code
 * @param code - The postal code to look up
 * @param stateCode - Optional state code to narrow the search (faster)
 */
export async function lookupPostalCode(
  countryCode: string,
  code: string,
  stateCode?: string
): Promise<IPostalCode[]> {
  const pool = stateCode
    ? await getPostalCodesOfState(countryCode, stateCode)
    : await getAllPostalCodesOfCountry(countryCode);
  return pool.filter((p) => p.code === code);
}

/**
 * Search postal codes within a country + state by locality name (case-insensitive substring match).
 * There is no city_id linkage in the upstream data, so locality name is the only usable place field.
 */
export async function searchPostalCodesByLocality(
  countryCode: string,
  stateCode: string,
  searchTerm: string
): Promise<IPostalCode[]> {
  const codes = await getPostalCodesOfState(countryCode, stateCode);
  const term = searchTerm.toLowerCase();
  return codes.filter((p) => p.locality_name.toLowerCase().includes(term));
}

/**
 * Search postal codes across an entire country by locality name (case-insensitive substring match).
 */
export async function searchPostalCodesByLocalityInCountry(
  countryCode: string,
  searchTerm: string
): Promise<IPostalCode[]> {
  const codes = await getAllPostalCodesOfCountry(countryCode);
  const term = searchTerm.toLowerCase();
  return codes.filter((p) => p.locality_name.toLowerCase().includes(term));
}

/**
 * Get the list of country codes that have postal code data.
 * Not all countries do — currently ~125 of 250.
 */
export async function getSupportedCountryCodes(): Promise<string[]> {
  const manifest = await getManifest();
  return manifest.map((e) => e.country_code);
}

/**
 * Check whether a country has any postal code data.
 */
export async function isCountrySupported(countryCode: string): Promise<boolean> {
  const codes = await getSupportedCountryCodes();
  return codes.includes(countryCode);
}
