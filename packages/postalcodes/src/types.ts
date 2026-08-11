/**
 * TypeScript interfaces for @countrystatecity/postalcodes
 */

/**
 * A single postal-code entry.
 *
 * `city_id` from the upstream source is omitted entirely — it is null on
 * 100% of upstream records and carries no usable information. Use
 * `locality_name` for place matching instead.
 */
export interface IPostalCode {
  id: number;
  code: string;
  country_code: string;
  state_code: string | null;
  locality_name: string | null;
  type: string;
  latitude: string | null;
  longitude: string | null;
}

/**
 * One manifest entry per country that has postal-code data.
 * Not all countries do — see getSupportedCountryCodes().
 */
export interface IPostalCodeManifestEntry {
  country_code: string;
  count: number;
  state_codes: string[];
  has_unassigned: boolean;
}
