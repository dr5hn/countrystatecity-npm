import { describe, it, expect } from 'vitest';
import { mapErrorResponse } from '../../../src/http/mapErrorResponse';
import {
  AuthenticationError,
  ValidationError,
  FeatureRestrictedError,
  RateLimitError,
  NotFoundError,
  NetworkError,
} from '../../../src/errors';

const url = 'https://api.countrystatecity.in/v1/countries/ZZ';

describe('mapErrorResponse', () => {
  it('401 -> AuthenticationError', () => {
    const err = mapErrorResponse({ status: 401, body: { message: 'bad key' }, url });
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.message).toBe('bad key');
    expect(err.statusCode).toBe(401);
  });

  it('403 -> FeatureRestrictedError, extracting camelCase fields', () => {
    const err = mapErrorResponse({
      status: 403,
      body: { message: 'upgrade required', feature: 'search', currentPlan: 'free', requiredPlan: 'pro', upgradeUrl: 'https://x/upgrade' },
      url,
    }) as FeatureRestrictedError;
    expect(err).toBeInstanceOf(FeatureRestrictedError);
    expect(err.feature).toBe('search');
    expect(err.currentPlan).toBe('free');
    expect(err.requiredPlan).toBe('pro');
    expect(err.upgradeUrl).toBe('https://x/upgrade');
  });

  it('403 -> FeatureRestrictedError, extracting snake_case fields', () => {
    const err = mapErrorResponse({
      status: 403,
      body: { current_plan: 'free', required_plan: 'pro', upgrade_url: 'https://x/upgrade' },
      url,
    }) as FeatureRestrictedError;
    expect(err.currentPlan).toBe('free');
    expect(err.requiredPlan).toBe('pro');
    expect(err.upgradeUrl).toBe('https://x/upgrade');
  });

  it('403 with no body falls back to the default pricing upgradeUrl', () => {
    const err = mapErrorResponse({ status: 403, body: undefined, url }) as FeatureRestrictedError;
    expect(err.upgradeUrl).toBe('https://app.countrystatecity.in/pricing');
  });

  it('404 -> NotFoundError', () => {
    const err = mapErrorResponse({ status: 404, body: { resource: 'country', identifier: 'ZZ' }, url }) as NotFoundError;
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.resource).toBe('country');
    expect(err.identifier).toBe('ZZ');
  });

  it('429 -> RateLimitError, passing through retryAfterSeconds', () => {
    const err = mapErrorResponse({
      status: 429,
      body: { limit: 1000, remaining: 0, resetAt: '2026-08-13T00:00:00Z', scope: 'daily' },
      url,
      retryAfterSeconds: 30,
    }) as RateLimitError;
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.limit).toBe(1000);
    expect(err.remaining).toBe(0);
    expect(err.resetAt).toBe('2026-08-13T00:00:00Z');
    expect(err.scope).toBe('daily');
    expect(err.retryAfter).toBe(30);
  });

  it('429 ignores an unrecognized scope value', () => {
    const err = mapErrorResponse({ status: 429, body: { scope: 'weekly' }, url }) as RateLimitError;
    expect(err.scope).toBeUndefined();
  });

  it.each([400, 422])('%i -> ValidationError', (status) => {
    const err = mapErrorResponse({ status, body: { field: 'limit', reason: 'out_of_range' }, url }) as ValidationError;
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.field).toBe('limit');
    expect(err.reason).toBe('out_of_range');
  });

  it('an unmapped status falls back to NetworkError with the real status', () => {
    const err = mapErrorResponse({ status: 500, body: undefined, url });
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.statusCode).toBe(500);
    expect(err.message).toContain('500');
  });

  it('uses a generic fallback message when the body has no message field', () => {
    const err = mapErrorResponse({ status: 401, body: { unrelated: true }, url });
    expect(err.message).toBe('Invalid or missing API key.');
  });

  it('carries the requestId through', () => {
    const err = mapErrorResponse({ status: 404, body: undefined, url, requestId: 'req_9' });
    expect(err.requestId).toBe('req_9');
  });
});
