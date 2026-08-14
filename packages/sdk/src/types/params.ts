/**
 * Per-resource request parameter types for @countrystatecity/sdk.
 */

import type { ChangeResourceType, SearchResultType } from './entities';

export interface IListParams {
  limit?: number;
  offset?: number;
}

/**
 * `fields`/`sort` map to the real API's `?fields=`/`?sort=` (Supporter+ tier)
 * — validated server-side (unknown field → 400, tier-inaccessible field →
 * silently dropped), so not re-validated here. Joined with `,` when the
 * request is built.
 */
export interface IListCountriesParams extends IListParams {
  fields?: string[];
  sort?: string[];
}

export interface IListStatesParams extends IListParams {
  country?: string;
  fields?: string[];
  sort?: string[];
}

export interface IListCitiesParams extends IListParams {
  country?: string;
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

export interface IChangesParams extends IListParams {
  since?: string;
  resource?: ChangeResourceType;
}

export interface IIsoLookupParams {
  iso2?: string;
  iso3?: string;
  numeric?: string;
}
