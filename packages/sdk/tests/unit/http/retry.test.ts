import { describe, it, expect } from 'vitest';
import { shouldRetry, computeBackoffDelay, parseRetryAfter } from '../../../src/http/retry';

describe('shouldRetry', () => {
  it('retries network and timeout errors while attempts remain', () => {
    expect(shouldRetry({ attempt: 0, maxRetries: 2, errorKind: 'network' })).toBe(true);
    expect(shouldRetry({ attempt: 0, maxRetries: 2, errorKind: 'timeout' })).toBe(true);
  });

  it('stops once attempts are exhausted', () => {
    expect(shouldRetry({ attempt: 2, maxRetries: 2, errorKind: 'network' })).toBe(false);
  });

  it('retries HTTP 429 and 5xx', () => {
    expect(shouldRetry({ attempt: 0, maxRetries: 2, errorKind: 'http', statusCode: 429 })).toBe(true);
    expect(shouldRetry({ attempt: 0, maxRetries: 2, errorKind: 'http', statusCode: 500 })).toBe(true);
    expect(shouldRetry({ attempt: 0, maxRetries: 2, errorKind: 'http', statusCode: 503 })).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])('never retries HTTP %i', (statusCode) => {
    expect(shouldRetry({ attempt: 0, maxRetries: 2, errorKind: 'http', statusCode })).toBe(false);
  });

  it('maxRetries: 0 never retries anything', () => {
    expect(shouldRetry({ attempt: 0, maxRetries: 0, errorKind: 'network' })).toBe(false);
    expect(shouldRetry({ attempt: 0, maxRetries: 0, errorKind: 'http', statusCode: 500 })).toBe(false);
  });
});

describe('computeBackoffDelay', () => {
  it('stays within [0, min(maxDelayMs, baseDelayMs * 2^attempt)]', () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      for (let i = 0; i < 50; i++) {
        const delay = computeBackoffDelay(attempt, 200, 2000);
        const cap = Math.min(2000, 200 * 2 ** attempt);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(cap);
      }
    }
  });

  it('is capped by maxDelayMs even at high attempt counts', () => {
    const delay = computeBackoffDelay(10, 200, 2000);
    expect(delay).toBeLessThanOrEqual(2000);
  });
});

describe('parseRetryAfter', () => {
  it('returns undefined for null/missing header', () => {
    expect(parseRetryAfter(null)).toBeUndefined();
  });

  it('parses delta-seconds form', () => {
    expect(parseRetryAfter('5')).toBe(5000);
  });

  it('parses an HTTP-date form as a positive delta', () => {
    const future = new Date(Date.now() + 10_000).toUTCString();
    const delay = parseRetryAfter(future);
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(10_000);
  });

  it('clamps a past HTTP-date to 0', () => {
    const past = new Date(Date.now() - 10_000).toUTCString();
    expect(parseRetryAfter(past)).toBe(0);
  });

  it('clamps very large delta-seconds to the 30s ceiling', () => {
    expect(parseRetryAfter('9999')).toBe(30_000);
  });

  it('returns undefined for a malformed header', () => {
    expect(parseRetryAfter('not-a-number-or-date')).toBeUndefined();
  });

  it('returns undefined for a negative delta-seconds value', () => {
    expect(parseRetryAfter('-5')).toBeUndefined();
  });
});
