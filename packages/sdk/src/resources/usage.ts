import { BaseResource } from './BaseResource';
import type { IUsageSnapshot } from '../types/entities';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class UsageResource extends BaseResource {
  /**
   * Returns the caller's current quota usage. If a previous request on this
   * client already surfaced rate-limit headers, that cached snapshot is
   * returned at zero network cost; otherwise this issues one lightweight
   * bootstrap request.
   */
  async get(opts?: IRequestOptions): Promise<CSCResponse<IUsageSnapshot>> {
    const cached = this.http.getLastMeta();
    const rateLimit = cached?.rateLimit;

    if (
      rateLimit?.dailyUsed !== undefined &&
      rateLimit.dailyLimit !== undefined &&
      rateLimit.monthlyUsed !== undefined &&
      rateLimit.monthlyLimit !== undefined
    ) {
      return Promise.resolve({
        data: {
          dailyUsed: rateLimit.dailyUsed,
          dailyLimit: rateLimit.dailyLimit,
          monthlyUsed: rateLimit.monthlyUsed,
          monthlyLimit: rateLimit.monthlyLimit,
        },
        meta: { ...cached, retryCount: 0 },
      });
    }

    return this.http.request(['usage'], undefined, opts);
  }
}
