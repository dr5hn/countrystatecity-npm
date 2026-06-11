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
  region: string;
  subregion: string;
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

export interface IState {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  fips_code: string | null;
  iso2: string;
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
}

export interface ConfigOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  cacheSize?: number;
}
