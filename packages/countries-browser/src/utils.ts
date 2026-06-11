/**
 * Utility functions for @countrystatecity/countries-browser
 */

import type { ICity } from './types';
import { getCountries, getStatesOfCountry, getCitiesOfState, getCountryByCode } from './loaders';

/**
 * Validate if a country code exists
 * @param countryCode - ISO2 country code to validate
 * @returns True if the country code is valid
 */
export async function isValidCountryCode(countryCode: string): Promise<boolean> {
  const countries = await getCountries();
  return countries.some((c) => c.iso2 === countryCode);
}

/**
 * Validate if a state code exists in a country
 * @param countryCode - ISO2 country code
 * @param stateCode - State code to validate
 * @returns True if the state code is valid for the given country
 */
export async function isValidStateCode(countryCode: string, stateCode: string): Promise<boolean> {
  const states = await getStatesOfCountry(countryCode);
  return states.some((s) => s.iso2 === stateCode);
}

/**
 * Search cities by name (partial match, case-insensitive)
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param searchTerm - Partial city name to search for
 * @returns Array of matching cities
 */
export async function searchCitiesByName(
  countryCode: string,
  stateCode: string,
  searchTerm: string,
): Promise<ICity[]> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  const lowerTerm = searchTerm.toLowerCase();
  return cities.filter((city) => city.name.toLowerCase().includes(lowerTerm));
}

/**
 * Get country name from ISO2 code
 * @param countryCode - ISO2 country code
 * @returns Country name or null if not found
 */
export async function getCountryNameByCode(countryCode: string): Promise<string | null> {
  const countries = await getCountries();
  const country = countries.find((c) => c.iso2 === countryCode);
  return country ? country.name : null;
}

/**
 * Get state name from codes
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns State name or null if not found
 */
export async function getStateNameByCode(
  countryCode: string,
  stateCode: string,
): Promise<string | null> {
  const states = await getStatesOfCountry(countryCode);
  const state = states.find((s) => s.iso2 === stateCode);
  return state ? state.name : null;
}

/**
 * Get timezone for a specific city
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @param cityName - Exact city name
 * @returns Timezone string or null if not found
 */
export async function getTimezoneForCity(
  countryCode: string,
  stateCode: string,
  cityName: string,
): Promise<string | null> {
  const cities = await getCitiesOfState(countryCode, stateCode);
  const city = cities.find((c) => c.name === cityName);
  return city ? city.timezone : null;
}

/**
 * Get all timezone names for a country
 * @param countryCode - ISO2 country code
 * @returns Array of timezone zone names or empty array if not found
 */
export async function getCountryTimezones(countryCode: string): Promise<string[]> {
  const meta = await getCountryByCode(countryCode);
  if (!meta || !meta.timezones) return [];
  return meta.timezones.map((tz) => tz.zoneName);
}
