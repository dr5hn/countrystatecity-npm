import { BaseResource } from './BaseResource';
import { assertIso2, assertNonEmptyString, assertListParams } from '../validation/assertions';
import type { ISearchResult } from '../types/entities';
import type { ISearchParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class SearchResource extends BaseResource {
  async fuzzy(params: ISearchParams, opts?: IRequestOptions): Promise<CSCResponse<ISearchResult[]>> {
    assertListParams(params);
    const query = assertNonEmptyString(params.query, 'query');
    const country = params.country !== undefined ? assertIso2(params.country) : undefined;

    return this.http.request(
      ['search'],
      { query, type: params.type, country, limit: params.limit, offset: params.offset },
      opts,
    );
  }
}
