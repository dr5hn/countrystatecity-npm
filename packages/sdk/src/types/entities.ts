/**
 * REST API entity types for @countrystatecity/sdk.
 *
 * Field shapes mirror @countrystatecity/countries' local dataset (same upstream
 * database), since the live API is expected to serve the same underlying fields.
 */

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

export interface ICurrency {
  code: string;
  name: string;
  symbol: string;
  numericCode?: string;
  decimalDigits?: number;
}

export interface IPhonecode {
  iso2: string;
  name: string;
  dialCode: string;
}

export interface ITimezone {
  zoneName: string;
  gmtOffset: number;
  gmtOffsetName: string;
  abbreviation: string;
  tzName: string;
  countryCode?: string;
}

export interface IConvertedTime {
  sourceTime: string;
  sourceTimezone: string;
  targetTime: string;
  targetTimezone: string;
}

export type SearchResultType = 'country' | 'state' | 'city';

export interface ISearchResult {
  type: SearchResultType;
  id: number;
  name: string;
  countryCode?: string;
  stateCode?: string;
  score: number;
}

export interface IUsageSnapshot {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  plan?: string;
}

export type ChangeResourceType = 'countries' | 'states' | 'cities';
export type ChangeOperation = 'created' | 'updated' | 'deleted';

export interface IChangeEvent {
  id: string;
  resource: ChangeResourceType;
  operation: ChangeOperation;
  resourceId: number;
  occurredAt: string;
}
