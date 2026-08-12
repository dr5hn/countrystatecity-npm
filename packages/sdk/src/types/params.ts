/**
 * Per-resource request parameter types for @countrystatecity/sdk.
 */

import type { ChangeResourceType, SearchResultType } from './entities';

export interface IListParams {
  limit?: number;
  offset?: number;
}

export type IListCountriesParams = IListParams;

export interface IListStatesParams extends IListParams {
  country?: string;
}

export interface IListCitiesParams extends IListParams {
  country?: string;
  state?: string;
  /** Free-form city classification (e.g. 'settlement'); not validated client-side, see docs. */
  kind?: string;
}

export interface ITimezoneConvertParams {
  time: string;
  from: string;
  to: string;
}

export interface ISearchParams extends IListParams {
  query: string;
  type?: SearchResultType;
  country?: string;
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
