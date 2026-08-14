/**
 * Per-resource request parameter types for @countrystatecity/sdk.
 */

import type { ChangeResourceType, SearchResultType } from './entities';

export interface IListParams {
  limit?: number;
  offset?: number;
}

/**
 * `locale`/`includeTranslations` map to the real API's `?locale=`/
 * `?include_translations=` (Professional+ tier) — same "validated
 * server-side, silently dropped outside the caller's tier, not a 403"
 * treatment as `fields`/`sort` below, so not re-validated here either.
 * Shared by every locale-capable method: list() calls (via the params
 * interfaces below) and single-entity get()/subregions() calls (passed
 * directly). Not available on cities.get() — no single-city GET endpoint
 * exists on the real API at all (a pre-existing gap, unrelated to this).
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
export interface ISearchParams {
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
 * client-side for a fast-fail. No `kind`/`language` yet — both deferred
 * server-side too (Task 02/Task 12).
 */
export interface IAutocompleteParams {
  query: string;
  type?: SearchResultType;
  country?: string;
  state?: string;
  limit?: number;
}

/**
 * `radius` is km, 1-500, default 25 server-side; `limit` is 1-100 (not
 * fuzzy/autocomplete's 1-50) default 20. `minPopulation` maps to the wire's
 * `min_population` — non-negative integer, no upper bound. Same
 * `country`-invalid-when-`type`-is-`country'` and `state`-requires-`country`
 * rules as `autocomplete()`. No `kind` filter yet — deferred server-side,
 * same as autocomplete's (Task 02).
 */
export interface INearbyParams {
  lat: number;
  lng: number;
  type?: SearchResultType;
  country?: string;
  state?: string;
  minPopulation?: number;
  radius?: number;
  limit?: number;
}

export interface IChangesParams extends IListParams {
  since?: string;
  resource?: ChangeResourceType;
}

export interface IIsoLookupParams {
  iso2?: string;
  iso3?: string;
  numeric?: string;
}
