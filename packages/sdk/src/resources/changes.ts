import { BaseResource } from './BaseResource';
import { assertListParams, assertIsoDateString } from '../validation/assertions';
import type { IChangeEvent } from '../types/entities';
import type { IChangesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

/**
 * @beta Endpoint availability isn't confirmed across all accounts/plans yet —
 * calls may 404 until the API ships it. Kept typed now so upgrading later
 * requires no SDK changes.
 */
export class ChangesResource extends BaseResource {
  async list(params?: IChangesParams, opts?: IRequestOptions): Promise<CSCResponse<IChangeEvent[]>> {
    assertListParams(params);
    const since = params?.since !== undefined ? assertIsoDateString(params.since, 'since') : undefined;

    return this.http.request(
      ['changes'],
      { since, resource: params?.resource, limit: params?.limit, offset: params?.offset },
      opts,
    );
  }
}
