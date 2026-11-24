/**
 * REST API entity types for @countrystatecity/sdk.
 *
 * Field shapes follow the REST API. Plan-gated fields and nullable links may
 * differ from the offline dataset.
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

/** IDs and populations are serialized as strings by the API; older clients may supply numbers. */
export type GeoId = string | number;

/** Basic city fields; additional fields depend on plan and field selection. */
export interface ICity {
  id: GeoId;
  name: string;
  kind?: CityKind;
  state_id?: GeoId | null;
  state_code?: string | null;
  country_id?: GeoId;
  country_code?: string;
  county_id?: GeoId | null;
  latitude?: string | null;
  longitude?: string | null;
  native?: string | null;
  timezone?: string | null;
  type?: string | null;
  level?: number | null;
  parent_id?: GeoId | null;
  population?: string | null;
  population_year?: number | null;
  wikiDataId?: string | null;
  translations?: ITranslations | null;
  localized_name?: string;
  matched_locale?: string;
}

/** One source-backed county membership; multi-state counties retain every entry. */
export interface ICountyState {
  id: string;
  name: string;
  code: string | null;
}

export interface ICounty {
  id: string;
  name: string;
  country_id: string;
  country_code: string;
  state_id: string | null;
  state_code: string | null;
  states: ICountyState[];
  type?: string | null;
  type_local?: string | null;
  level?: number | null;
  parent_id?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  native?: string | null;
  population?: string | null;
  timezone?: string | null;
  translations?: ITranslations | null;
  wikiDataId?: string | null;
  localized_name?: string;
  matched_locale?: string;
}

/** Postcode IDs are strings and coordinates, when available, are numbers. */
export interface IPostcode {
  id: string;
  code: string;
  country_code: string;
  state_code: string | null;
  locality_name: string | null;
  type: string;
  country_id?: string;
  state_id?: string | null;
  city_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
  wikiDataId?: string | null;
}

export interface IPostcodeMatches {
  data: IPostcode[];
  meta: { country_code: string; query: string; match_count: number };
}

export interface IPostcodePage {
  data: IPostcode[];
  pagination: { limit: number; next_cursor: string | null; has_more: boolean };
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

export type ChangePlaceType = 'country' | 'state' | 'city' | 'county' | 'postcode';

export type ChangeType =
  | 'added'
  | 'removed'
  | 'renamed'
  | 'place_group_changed'
  | 'parent_changed'
  | 'coordinates_changed'
  | 'other_fields_changed';

/**
 * Tier-filtered place values from the change feed. Updates contain only the
 * fields that changed; additions and removals contain every field visible to
 * the caller. The exact keys can grow with the API, so they are intentionally
 * not narrowed to the SDK's normal full-entity interfaces.
 */
export type IChangeValues = Record<string, unknown>;

interface IChangeEventBase {
  change_id: string;
  data_version: string;
  changed_at: string;
  /** The database BigInt is serialized as a string. */
  place_id: string;
  change_type: ChangeType;
  old_values: IChangeValues | null;
  new_values: IChangeValues | null;
}

export interface ICountryChangeEvent extends IChangeEventBase {
  place_type: 'country';
}

export interface IStateChangeEvent extends IChangeEventBase {
  place_type: 'state';
}

export interface ICityChangeEvent extends IChangeEventBase {
  place_type: 'city';
}

export interface ICountyChangeEvent extends IChangeEventBase {
  place_type: 'county';
}

export interface IPostcodeChangeEvent extends IChangeEventBase {
  place_type: 'postcode';
}

export type IChangeEvent = ICountryChangeEvent | IStateChangeEvent | ICityChangeEvent | ICountyChangeEvent | IPostcodeChangeEvent;

export interface IChangeFeedPage {
  results: IChangeEvent[];
  next_page_token: string | null;
}
