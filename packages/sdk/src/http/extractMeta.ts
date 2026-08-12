/**
 * Extracts response metadata from headers, field-by-field (never all-or-nothing
 * like the CLI's extractUsage) so partial header sets still surface what's there.
 */

import type { CSCResponseMeta, CacheStatus, IRateLimitMeta, IPaginationMeta } from '../types/response';

function num(headers: Headers, name: string): number | undefined {
  const value = headers.get(name);
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function extractRateLimit(headers: Headers): IRateLimitMeta | undefined {
  const dailyUsed = num(headers, 'x-csc-daily-used');
  const dailyLimit = num(headers, 'x-csc-daily-limit');
  const monthlyUsed = num(headers, 'x-csc-monthly-used');
  const monthlyLimit = num(headers, 'x-csc-monthly-limit');

  if (
    dailyUsed === undefined &&
    dailyLimit === undefined &&
    monthlyUsed === undefined &&
    monthlyLimit === undefined
  ) {
    return undefined;
  }
  return { dailyUsed, dailyLimit, monthlyUsed, monthlyLimit };
}

function extractPagination(headers: Headers): IPaginationMeta | undefined {
  const total = num(headers, 'x-csc-total-count');
  const limit = num(headers, 'x-csc-limit');
  const offset = num(headers, 'x-csc-offset');

  if (total === undefined && limit === undefined && offset === undefined) return undefined;

  const hasMore =
    total !== undefined && offset !== undefined && limit !== undefined ? offset + limit < total : undefined;

  return { total, limit, offset, hasMore };
}

function extractCache(headers: Headers): CacheStatus | undefined {
  const value = headers.get('x-csc-cache');
  return value === 'HIT' || value === 'MISS' || value === 'DYNAMIC' ? value : undefined;
}

export function extractMeta(headers: Headers, retryCount: number): CSCResponseMeta {
  return {
    requestId: headers.get('x-request-id') ?? headers.get('x-csc-request-id') ?? undefined,
    rateLimit: extractRateLimit(headers),
    dataVersion: headers.get('x-csc-data-version') ?? undefined,
    cache: extractCache(headers),
    pagination: extractPagination(headers),
    retryCount,
  };
}
