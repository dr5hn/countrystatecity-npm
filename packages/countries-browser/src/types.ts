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
  type?: string | null;
  population?: number | null;
  wikiDataId?: string | null;
}

/**
 * Which source-data release this package's data was generated from.
 *
 * Same shape as the Country State City API's `GET /v1/meta/data-version`
 * response, minus `regions`/`subregions` in `recordCounts`, which these
 * packages don't ship.
 *
 * To check whether this package and a live API response describe the same
 * data, compare `sourceRelease` — not `dataVersion`. Both sides format
 * `dataVersion` as `<source-release>-<YYYY.MM.DD>`, but the date half comes
 * from a different event on each side: the release's publish date here, and
 * the date that release was imported into the API database on the API side.
 * The two strings therefore routinely differ by a day or more even when both
 * hold exactly the same data.
 */
export interface IDataVersion {
  /** `<source-release>-<YYYY.MM.DD>`, where the date is this release's publish date. */
  dataVersion: string;
  /** The upstream release tag — identical on the API side, so use it for parity checks. */
  sourceRelease: string;
  /** ISO 8601 UTC timestamp of the release's publish time, to millisecond precision. */
  updatedAt: string;
  /** Row counts for this release. Narrower than the API's, which also reports regions/subregions. */
  recordCounts: {
    countries: number;
    states: number;
    cities: number;
  };
}

export interface ConfigOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  cacheSize?: number;
}
