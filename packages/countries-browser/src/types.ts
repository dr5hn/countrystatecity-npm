/**
 * TypeScript interfaces for @countrystatecity/countries-browser
 * Copied from @countrystatecity/countries for API compatibility
 */

export interface ITimezone {
  zoneName: string;
  gmtOffset: number;
  gmtOffsetName: string;
  abbreviation: string;
  tzName: string;
}

export interface ITranslations {
  [languageCode: string]: string;
}

export interface ICountry {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  numeric_code: string;
  phonecode: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  tld: string;
  native: string;
  population: number | null;
  gdp: number | null;
  region: string;
  region_id: number | null;
  subregion: string;
  subregion_id: number | null;
  nationality: string;
  latitude: string;
  longitude: string;
  emoji: string;
  emojiU: string;
}

export interface ICountryMeta extends ICountry {
  timezones: ITimezone[];
  translations: ITranslations;
}

export interface IRegion {
  id: number;
  name: string;
  translations: ITranslations;
  wikiDataId: string | null;
}

export interface ISubregion {
  id: number;
  name: string;
  region_id: number;
  translations: ITranslations;
  wikiDataId: string | null;
}

export interface IState {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  fips_code: string | null;
  iso2: string;
  iso3166_2: string | null;
  type: string | null;
  latitude: string | null;
  longitude: string | null;
  native: string | null;
  timezone: string | null;
  translations: ITranslations;
}

export interface ICity {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  country_id: number;
  country_code: string;
  latitude: string;
  longitude: string;
  native: string | null;
  timezone: string | null;
  translations: ITranslations;
  /** Place classification from the source database (e.g. "city", "adm1", "adm2"). Null if unavailable. */
  type: string | null;
  population: number | null;
  wikiDataId: string | null;
}

export interface ConfigOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  cacheSize?: number;
}
