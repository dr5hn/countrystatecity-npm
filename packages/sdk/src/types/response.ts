/**
 * Response envelope and metadata types for @countrystatecity/sdk.
 */

export type CacheStatus = 'HIT' | 'MISS' | 'DYNAMIC';

export interface IRateLimitMeta {
  dailyUsed?: number;
  dailyLimit?: number;
  monthlyUsed?: number;
  monthlyLimit?: number;
}

export interface IPaginationMeta {
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
}

/**
 * Metadata about a request, kept alongside — never merged into — the entity
 * data so response shapes stay identical to what the REST API returns.
 */
export interface CSCResponseMeta {
  requestId?: string;
  rateLimit?: IRateLimitMeta;
  dataVersion?: string;
  cache?: CacheStatus;
  pagination?: IPaginationMeta;
  /** Number of retries this call needed before succeeding (0 if none). */
  retryCount: number;
}

export interface CSCResponse<T> {
  data: T;
  meta: CSCResponseMeta;
}
