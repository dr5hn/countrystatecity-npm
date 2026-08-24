import { BaseResource } from './BaseResource';
import { assertChangesParams, assertIso2, assertIsoDateTimeString } from '../validation/assertions';
import type { IChangeFeedPage } from '../types/entities';
import type { IChangesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class ChangesResource extends BaseResource {
  /** Lists a stable, cursor-paginated snapshot of data changes (Business plan). */
  async list(params?: IChangesParams, opts?: IRequestOptions): Promise<CSCResponse<IChangeFeedPage>> {
    assertChangesParams(params);
    const startDate = params?.startDate === undefined
      ? undefined
      : assertIsoDateTimeString(params.startDate, 'startDate');
    const countryCode = params?.countryCode === undefined
      ? undefined
      : assertIso2(params.countryCode, 'countryCode');

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
