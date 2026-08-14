import { BaseResource } from './BaseResource';
import {
  assertIso2,
  assertNonEmptyString,
  assertSearchParams,
  assertAutocompleteParams,
  assertNearbyParams,
  assertLatitude,
  assertLongitude,
} from '../validation/assertions';
import type { ISearchResult, IAutocompleteResult, INearbyResult } from '../types/entities';
import type { ISearchParams, IAutocompleteParams, INearbyParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class SearchResource extends BaseResource {
  /**
   * The response body doesn't self-describe which entity type each row is
   * (the request already pins one type per call) — `type` is injected here
   * client-side rather than trusted from the wire.
   */
  async fuzzy(params: ISearchParams, opts?: IRequestOptions): Promise<CSCResponse<ISearchResult[]>> {
    assertSearchParams(params);
    const q = assertNonEmptyString(params.query, 'query');
    const country = params.country !== undefined ? assertIso2(params.country) : undefined;
    const type = params.type ?? 'city';

    const response = await this.http.request<Array<Record<string, unknown>>>(
      ['search', 'fuzzy'],
      { q, type, country, limit: params.limit, threshold: params.threshold },
      opts,
    );

    return {
      ...response,
      data: response.data.map((row) => ({ ...row, type })) as ISearchResult[],
    };
  }

  /**
   * Type-ahead search — a separate endpoint from `fuzzy()`, tuned for
   * exact/starts-with/fuzzy-tiered ranking and a computed display `label`
   * (e.g. "Bangalore, Karnataka, India") rather than a raw similarity score
   * alone.
   */
  async autocomplete(params: IAutocompleteParams, opts?: IRequestOptions): Promise<CSCResponse<IAutocompleteResult[]>> {
    assertAutocompleteParams(params);
    const q = params.query.trim();
    const country = params.country !== undefined ? assertIso2(params.country) : undefined;
    const state = params.state?.trim().toUpperCase();
    const type = params.type ?? 'city';

    return this.http.request<IAutocompleteResult[]>(
      ['search', 'autocomplete'],
      { q, type, country, state, limit: params.limit },
      opts,
    );
  }

  /**
   * Places near a lat/lng, nearest-first. Distinct endpoint from both
   * `fuzzy()`/`autocomplete()` — no text query at all, just coordinates plus
   * the same `type`/`country`/`state` filters. Like the others, the response
   * never includes `type` itself — injected here client-side.
   */
  async nearby(params: INearbyParams, opts?: IRequestOptions): Promise<CSCResponse<INearbyResult[]>> {
    assertNearbyParams(params);
    const lat = assertLatitude(params.lat, 'lat');
    const lng = assertLongitude(params.lng, 'lng');
    const country = params.country !== undefined ? assertIso2(params.country) : undefined;
    const state = params.state?.trim().toUpperCase();
    const type = params.type ?? 'city';

    const response = await this.http.request<Array<Record<string, unknown>>>(
      ['search', 'nearby'],
      {
        lat,
        lng,
        type,
        kind: params.kind,
        country,
        state,
        min_population: params.minPopulation,
        radius: params.radius,
        limit: params.limit,
      },
      opts,
    );

    return {
      ...response,
      data: response.data.map((row) => ({ ...row, type })) as INearbyResult[],
    };
  }
}
