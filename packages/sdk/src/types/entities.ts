/**
 * REST API entity types for @countrystatecity/sdk.
 *
 * Field shapes mirror @countrystatecity/countries' local dataset (same upstream
 * database), since the live API is expected to serve the same underlying fields.
 */

/** JSON string keyed by language code, exactly as returned by the API. */
export type ITranslations = string;

/**
 * `translations`/`localized_name`/`matched_locale` are all opt-in/
 * conditional, never guaranteed: `translations` only appears when
 * `includeTranslations` is passed (Professional and Business plans; silently omitted
 * otherwise — not a 403), and `localized_name`/`matched_locale` only when
 * `locale` is passed (same tier/omission rule). `name`/`id` are never
 * replaced by localization — both stay present and stable regardless.
 */
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
  translations?: ITranslations;
  localized_name?: string;
  matched_locale?: string;
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
  translations?: ITranslations;
  localized_name?: string;
  matched_locale?: string;
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
  translations?: ITranslations;
  localized_name?: string;
  matched_locale?: string;
}

export interface IRegion {
  id: number;
  name: string;
  translations?: ITranslations;
  wikiDataId: string | null;
  localized_name?: string;
  matched_locale?: string;
}

export interface ISubregion {
  id: number;
  name: string;
  region_id: number;
  translations?: ITranslations;
  wikiDataId: string | null;
  localized_name?: string;
  matched_locale?: string;
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
export type CityKind = 'settlement' | 'administrative' | 'section' | 'unknown';

/**
 * Fields every fuzzy-search hit carries in addition to the matched entity's
 * own fields. `type` is injected client-side (the response body doesn't
 * self-describe it — the request already pins one type per call).
 */
export interface ISearchMatchMeta {
  match_score: number;
  matched_alias: string | null;
}

/**
 * A country result is `Partial<ICountry>` (not full `ICountry`) because
 * which fields are present depends on the caller's plan tier — the same
 * basic/coordinates/full gating applied to `csc.countries.get()`.
 */
export interface ICountrySearchResult extends Partial<ICountry>, ISearchMatchMeta {
  type: 'country';
}

export interface IStateSearchResult extends Partial<IState>, ISearchMatchMeta {
  type: 'state';
  country_name: string;
}

export interface ICitySearchResult extends Partial<ICity>, ISearchMatchMeta {
  type: 'city';
  country_name: string;
  state_name: string | null;
}

export type ISearchResult = ICountrySearchResult | IStateSearchResult | ICitySearchResult;

export type AutocompleteMatchedField = 'name' | 'native' | 'translation';

/**
 * Fields every autocomplete hit carries in addition to the matched entity's
 * own fields. Unlike `csc.search.fuzzy()`'s results, `country_name`/
 * `state_name` are NOT included separately — they're folded into `label`
 * server-side instead (e.g. "Bangalore, Karnataka, India").
 */
export interface IAutocompleteMatchMeta {
  label: string;
  match_score: number;
  matched_field: AutocompleteMatchedField;
}

export interface ICountryAutocompleteResult extends Partial<ICountry>, IAutocompleteMatchMeta {
  type: 'country';
}

export interface IStateAutocompleteResult extends Partial<IState>, IAutocompleteMatchMeta {
  type: 'state';
}

export interface ICityAutocompleteResult
  extends Omit<Partial<ICity>, 'country_code' | 'state_code'>,
    IAutocompleteMatchMeta {
  type: 'city';
  /** Always present regardless of plan tier — unlike most city fields, not tier-gated. */
  country_code: string;
  /** null for cities with no state subdivision on record. */
  state_code: string | null;
}

export type IAutocompleteResult = ICountryAutocompleteResult | IStateAutocompleteResult | ICityAutocompleteResult;

/**
 * Fields every nearby-search hit carries in addition to the matched entity's
 * own (tier-gated) fields. `country_name`/`state_name` mirror `fuzzy()`'s
 * convention exactly — unconditional, never tier-gated — unlike
 * `autocomplete()`, there's no field-collision here so no `Omit<>` override
 * is needed: `country_code`/`state_code` stay ordinary tier-gated
 * `Partial<ICity>` fields, same as in `ISearchResult`.
 */
export interface INearbyMatchMeta {
  distance_km: number;
}

export interface INearbyCountryResult extends Partial<ICountry>, INearbyMatchMeta {
  type: 'country';
}

export interface INearbyStateResult extends Partial<IState>, INearbyMatchMeta {
  type: 'state';
  country_name: string;
}

export interface INearbyCityResult extends Partial<ICity>, INearbyMatchMeta {
  type: 'city';
  kind: CityKind;
  country_name: string;
  state_name: string | null;
}

export type INearbyResult = INearbyCountryResult | INearbyStateResult | INearbyCityResult;

export interface IUsageSnapshot {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  plan?: string;
}
