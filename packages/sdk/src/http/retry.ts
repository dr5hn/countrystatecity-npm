/**
 * Retry decision + full-jitter exponential backoff for idempotent GET requests.
 */

export type ErrorKind = 'network' | 'timeout' | 'http';

export interface ShouldRetryInput {
  /** Number of attempts already made and failed (0-indexed). */
  attempt: number;
  maxRetries: number;
  errorKind: ErrorKind;
  statusCode?: number;
}

/**
 * Retries transient network errors, our own timeouts, HTTP 429, and HTTP 5xx.
 * Never retries 4xx (other than 429) — those are never transient.
 */
export function shouldRetry(input: ShouldRetryInput): boolean {
  if (input.attempt >= input.maxRetries) return false;

  if (input.errorKind === 'network' || input.errorKind === 'timeout') return true;

  if (input.errorKind === 'http') {
    if (input.statusCode === 429) return true;
    if (input.statusCode !== undefined && input.statusCode >= 500 && input.statusCode < 600) return true;
  }

  return false;
}

/** Full-jitter exponential backoff: delay = random(0, min(maxDelayMs, baseDelayMs * 2^attempt)). */
export function computeBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.random() * cap;
}

const RETRY_AFTER_CEILING_MS = 30_000;

/** Parses a `Retry-After` header (delta-seconds or HTTP-date form, RFC 7231), clamped to a 30s ceiling. */
export function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;
  const trimmed = headerValue.trim();
  if (trimmed === '') return undefined;

  const seconds = Number(trimmed);
  if (Number.isFinite(seconds)) {
    // A numeric value is only valid as non-negative delta-seconds — don't fall
    // through to Date.parse, whose legacy leniency accepts garbage like "-5".
    return seconds >= 0 ? Math.min(seconds * 1000, RETRY_AFTER_CEILING_MS) : undefined;
  }

  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return Math.min(Math.max(delta, 0), RETRY_AFTER_CEILING_MS);
  }

  return undefined;
}
