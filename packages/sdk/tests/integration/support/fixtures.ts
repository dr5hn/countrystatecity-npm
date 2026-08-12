/**
 * Hand-authored realistic response bodies for the integration suite.
 * Endpoint paths/shapes aren't confirmed against the live API — see the
 * "Open questions" section of packages/sdk's implementation plan.
 */

import type {
  ICountry,
  IState,
  ICity,
  IRegion,
  ISubregion,
  ICurrency,
  IPhonecode,
  ITimezone,
  ISearchResult,
  IChangeEvent,
} from '../../../src/types/entities';

export const INDIA: ICountry = {
  id: 101,
  name: 'India',
  iso2: 'IN',
  iso3: 'IND',
  numeric_code: '356',
  phonecode: '91',
  capital: 'New Delhi',
  currency: 'INR',
  currency_name: 'Indian Rupee',
  currency_symbol: '₹',
  tld: '.in',
  native: 'भारत',
  population: 1_400_000_000,
  gdp: 3_700_000_000_000,
  region: 'Asia',
  region_id: 3,
  subregion: 'Southern Asia',
  subregion_id: 14,
  nationality: 'Indian',
  latitude: '20.00000000',
  longitude: '77.00000000',
  emoji: '🇮🇳',
  emojiU: 'U+1F1EE U+1F1F3',
};

export const MAHARASHTRA: IState = {
  id: 4008,
  name: 'Maharashtra',
  country_id: 101,
  country_code: 'IN',
  fips_code: '16',
  iso2: 'MH',
  iso3166_2: 'IN-MH',
  type: 'State',
  latitude: '19.75148',
  longitude: '75.71389',
  native: null,
  timezone: 'Asia/Kolkata',
  translations: {},
};

export const MUMBAI: ICity = {
  id: 132649,
  name: 'Mumbai',
  state_id: 4008,
  state_code: 'MH',
  country_id: 101,
  country_code: 'IN',
  latitude: '19.07283',
  longitude: '72.88261',
  native: null,
  timezone: 'Asia/Kolkata',
  translations: {},
};

export const ASIA_REGION: IRegion = {
  id: 3,
  name: 'Asia',
  translations: {},
  wikiDataId: 'Q48',
};

export const SOUTHERN_ASIA_SUBREGION: ISubregion = {
  id: 14,
  name: 'Southern Asia',
  region_id: 3,
  translations: {},
  wikiDataId: 'Q34019',
};

export const INR: ICurrency = {
  code: 'INR',
  name: 'Indian Rupee',
  symbol: '₹',
  numericCode: '356',
  decimalDigits: 2,
};

export const INDIA_PHONECODE: IPhonecode = {
  iso2: 'IN',
  name: 'India',
  dialCode: '+91',
};

export const KOLKATA_TZ: ITimezone = {
  zoneName: 'Asia/Kolkata',
  gmtOffset: 19800,
  gmtOffsetName: 'UTC+05:30',
  abbreviation: 'IST',
  tzName: 'India Standard Time',
  countryCode: 'IN',
};

export const MUMBAI_SEARCH_RESULT: ISearchResult = {
  type: 'city',
  id: 132649,
  name: 'Mumbai',
  countryCode: 'IN',
  stateCode: 'MH',
  score: 0.98,
};

export const SAMPLE_CHANGE_EVENT: IChangeEvent = {
  id: 'chg_1',
  resource: 'cities',
  operation: 'updated',
  resourceId: 132649,
  occurredAt: '2026-08-01T00:00:00Z',
};

export const USAGE_HEADERS = {
  'x-csc-daily-used': '12',
  'x-csc-daily-limit': '1000',
  'x-csc-monthly-used': '340',
  'x-csc-monthly-limit': '30000',
};
