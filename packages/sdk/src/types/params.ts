/**
 * Per-resource request parameter types for @countrystatecity/sdk.
 */

import type { ChangePlaceType, ChangeType, CityKind, SearchResultType } from './entities';

export interface IListParams {
  limit?: number;
  offset?: number;
}

/**
 * `locale`/`includeTranslations` map to the real API's `?locale=`/
 * `?include_translations=` (Professional and Business plans). The SDK
 * validates and canonicalizes these values before making a request.
 * Shared by every locale-capable geographic and search method. Not available
 * on cities.get() because the API has no single-city endpoint.
 */
export interface ILocalizationParams {
  locale?: string;
  includeTranslations?: boolean;
}

/**
 * `fields`/`sort` map to the real API's `?fields=`/`?sort=` (Supporter+ tier)
 * — validated server-side (unknown field → 400, tier-inaccessible field →
 * silently dropped), so not re-validated here. Joined with `,` when the
 * request is built.
 */
export interface IListCountriesParams extends IListParams, ILocalizationParams {
  fields?: string[];
  sort?: string[];
}

export interface IListStatesParams extends IListParams, ILocalizationParams {
  country?: string;
  fields?: string[];
  sort?: string[];
}

/**
 * `country` is required (unlike `IListCountriesParams`/`IListStatesParams`)
 * — the real API has no bare `GET /cities` route, so an unfiltered call
 * would always 404. Enforced both at the type level here and at runtime in
 * `CitiesResource.list()` for callers not using TypeScript.
 */
export interface IListCitiesParams extends IListParams, ILocalizationParams {
  country: string;
  state?: string;
  /** Free-form city classification (e.g. 'settlement'); not validated client-side, see docs. */
  kind?: string;
  fields?: string[];
  sort?: string[];
}

export interface ITimezoneConvertParams {
  time: string;
  from: string;
  to: string;
}

/**
 * Fuzzy search has its own limit range (1-50, not the usual 1-100) and no
 * offset/pagination support server-side, so this deliberately doesn't
 * extend IListParams.
 */
export interface ISearchParams extends ILocalizationParams {
  query: string;
  type?: SearchResultType;
  country?: string;
  limit?: number;
  /** Similarity threshold (0.1-1, default 0.3) — lower matches more loosely. */
  threshold?: number;
}

/**
 * Autocomplete shares fuzzy search's 1-50 limit range (default 10) but has
 * no threshold param — ranking is dominated by exact/starts-with/fuzzy
 * tiering server-side, not a tunable similarity cutoff. `state` requires
 * `country` (state codes aren't globally unique); `country` is invalid
 * when `type` is `'country'` — both enforced server-side and mirrored
 * client-side for a fast-fail.
 */
export interface IAutocompleteParams extends ILocalizationParams {
  query: string;
  type?: SearchResultType;
  country?: string;
  state?: string;
  limit?: number;
}

/**
 * Nearby-search parameters. `kind` and `state` are valid only for city
 * searches. `state` also requires `country`.
 */
export interface INearbyParams extends ILocalizationParams {
  lat: number;
  lng: number;
  type?: SearchResultType;
  kind?: CityKind;
  country?: string;
  state?: string;
  minPopulation?: number;
  radius?: number;
  limit?: number;
}

/** Parameters for the cursor-paginated Business-tier data change feed. */
export interface IChangesParams {
  startDate?: string;
  placeType?: ChangePlaceType;
  countryCode?: string;
  changeType?: ChangeType;
  limit?: number;
  nextPageToken?: string;
}

export interface IIsoLookupParams {
  iso2?: string;
  iso3?: string;
  numeric?: string;
}
