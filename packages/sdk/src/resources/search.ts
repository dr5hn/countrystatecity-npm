import { BaseResource } from './BaseResource';
import { assertIso2, assertNonEmptyString, assertSearchParams, assertAutocompleteParams } from '../validation/assertions';
import type { ISearchResult, IAutocompleteResult } from '../types/entities';
import type { ISearchParams, IAutocompleteParams } from '../types/params';
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
}
