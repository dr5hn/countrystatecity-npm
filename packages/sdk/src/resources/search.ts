import { BaseResource } from './BaseResource';
import { assertIso2, assertNonEmptyString, assertSearchParams } from '../validation/assertions';
import type { ISearchResult } from '../types/entities';
import type { ISearchParams } from '../types/params';
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
}
