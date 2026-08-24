/**
 * Client configuration types for @countrystatecity/sdk.
 */

export interface RetryOptions {
  /** Number of retries after the initial attempt. Default: 2. */
  retries?: number;
  /** Base delay in ms for exponential backoff. Default: 200. */
  baseDelayMs?: number;
  /** Maximum backoff delay in ms, before jitter. Default: 2000. */
  maxDelayMs?: number;
}

export interface CSCClientOptions {
  /** API key sent as the X-CSCAPI-KEY header. Required; never read from env or persisted. */
  apiKey: string;
  /** Default: 'https://api.countrystatecity.in/v1'. */
  baseUrl?: string;
  /** Per-attempt request timeout in ms. Default: 10000. */
  timeout?: number;
  /** Custom fetch implementation (polyfill, proxy-aware wrapper, etc). Default: global fetch. */
  fetch?: typeof fetch;
  /** Extra headers merged into every request. Cannot override X-CSCAPI-KEY or Accept. */
  headers?: Record<string, string>;
  /** Retry behavior for idempotent GET requests. Pass `false` to disable retries entirely. */
  retry?: RetryOptions | false;
  /** Overrides the default `countrystatecity-sdk-js/<version>` User-Agent header. */
  userAgent?: string;
}

export interface ResolvedRetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface ResolvedCSCConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  fetchImpl: typeof fetch;
  headers: Record<string, string>;
  retry: ResolvedRetryOptions | false;
  userAgent: string;
}

/** Per-call overrides accepted as the trailing argument of every resource method. */
export interface IRequestOptions {
  signal?: AbortSignal;
  timeout?: number;
  headers?: Record<string, string>;
}
