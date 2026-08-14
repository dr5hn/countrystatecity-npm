import { BaseResource } from './BaseResource';
import { assertIso2, assertIsoDateString, assertChangesParams } from '../validation/assertions';
import type { IChangeFeedPage } from '../types/entities';
import type { IChangesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class ChangesResource extends BaseResource {
  /**
   * Cursor-paginated feed of country/state/city changes (Business tier).
   * Unlike every other `list()` in this SDK, `data` is an object
   * (`{ results, next_page_token }`), not a bare array — matches the real
   * wire response exactly. Pass the previous page's `nextPageToken` alone
   * to continue; resending a disagreeing filter alongside it is a hard
   * `ValidationError`-mapped 400 server-side, not silently dropped.
   */
  async list(params?: IChangesParams, opts?: IRequestOptions): Promise<CSCResponse<IChangeFeedPage>> {
    assertChangesParams(params ?? {});
    const startDate = params?.startDate !== undefined ? assertIsoDateString(params.startDate, 'startDate') : undefined;
    const countryCode = params?.countryCode !== undefined ? assertIso2(params.countryCode) : undefined;

    return this.http.request(
      ['changes'],
      {
        start_date: startDate,
        place_type: params?.placeType,
        country_code: countryCode,
        change_type: params?.changeType,
        limit: params?.limit,
        next_page_token: params?.nextPageToken,
      },
      opts,
    );
  }
}
