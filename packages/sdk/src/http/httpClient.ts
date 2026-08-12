/**
 * Orchestrates a single GET request: URL building, per-attempt timeout,
 * retry-with-backoff, response-metadata extraction, and error mapping.
 *
 * Every resource method is a read (list/get), so this client only ever
 * issues GET requests — the only method the retry policy needs to reason about.
 */

import type { ResolvedCSCConfig, IRequestOptions } from '../types/config';
import type { CSCResponse, CSCResponseMeta } from '../types/response';
import { NetworkError, TimeoutError } from '../errors';
import { buildUrl, type QueryValue } from './buildUrl';
import { combineSignals } from './combineSignals';
import { shouldRetry, computeBackoffDelay, parseRetryAfter } from './retry';
import { extractMeta } from './extractMeta';
import { mapErrorResponse } from './mapErrorResponse';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export class HttpClient {
  private lastMeta: CSCResponseMeta | undefined;

  constructor(private readonly config: ResolvedCSCConfig) {}

  getLastMeta(): CSCResponseMeta | undefined {
    return this.lastMeta;
  }

  async request<T>(
    segments: Array<string | number>,
    query?: Record<string, QueryValue>,
    opts: IRequestOptions = {},
  ): Promise<CSCResponse<T>> {
    const url = buildUrl(this.config.baseUrl, segments, query);
    const retryConfig = this.config.retry === false ? { retries: 0, baseDelayMs: 0, maxDelayMs: 0 } : this.config.retry;
    const timeout = opts.timeout ?? this.config.timeout;

    let attempt = 0;
    for (;;) {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
      const combined = combineSignals([opts.signal, timeoutController.signal]);

      let response: Response;
      try {
        response = await this.config.fetchImpl(url, {
          method: 'GET',
          signal: combined.signal,
          headers: {
            // User-supplied headers are applied first so the protected ones
            // below always win, per the "cannot override X-CSCAPI-KEY/Accept" contract.
            ...this.config.headers,
            ...opts.headers,
            Accept: 'application/json',
            'X-CSCAPI-KEY': this.config.apiKey,
            'User-Agent': this.config.userAgent,
          },
        });
      } catch (err) {
        clearTimeout(timeoutId);
        combined.dispose();

        if (opts.signal?.aborted) {
          // Caller-initiated cancellation: rethrow the native AbortError untouched, never retried.
          throw err;
        }

        if (timeoutController.signal.aborted) {
          if (shouldRetry({ attempt, maxRetries: retryConfig.retries, errorKind: 'timeout' })) {
            await sleep(computeBackoffDelay(attempt, retryConfig.baseDelayMs, retryConfig.maxDelayMs));
            attempt++;
            continue;
          }
          const timeoutError = new TimeoutError(`Request timed out after ${timeout}ms: ${url}`, timeout, { url });
          timeoutError.retryCount = attempt;
          throw timeoutError;
        }

        if (shouldRetry({ attempt, maxRetries: retryConfig.retries, errorKind: 'network' })) {
          await sleep(computeBackoffDelay(attempt, retryConfig.baseDelayMs, retryConfig.maxDelayMs));
          attempt++;
          continue;
        }
        const networkError = new NetworkError(`Network request failed: ${(err as Error).message}`, { url, cause: err });
        networkError.retryCount = attempt;
        throw networkError;
      }

      clearTimeout(timeoutId);
      combined.dispose();

      if (response.ok) {
        const data = (await safeJson(response)) as T;
        const meta = extractMeta(response.headers, attempt);
        this.lastMeta = meta;
        return { data, meta };
      }

      const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));

      if (shouldRetry({ attempt, maxRetries: retryConfig.retries, errorKind: 'http', statusCode: response.status })) {
        const delay = retryAfterMs ?? computeBackoffDelay(attempt, retryConfig.baseDelayMs, retryConfig.maxDelayMs);
        await sleep(delay);
        attempt++;
        continue;
      }

      const bodyJson = await safeJson(response);
      const error = mapErrorResponse({
        status: response.status,
        body: bodyJson,
        url,
        requestId: response.headers.get('x-request-id') ?? undefined,
        retryAfterSeconds: retryAfterMs !== undefined ? retryAfterMs / 1000 : undefined,
      });
      error.retryCount = attempt;
      throw error;
    }
  }
}
