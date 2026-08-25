import { describe, it, expect } from 'vitest';
import { mapErrorResponse } from '../../../src/http/mapErrorResponse';
import {
  AuthenticationError,
  ForbiddenError,
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

  it('403 -> FeatureRestrictedError from the canonical nested API envelope', () => {
    const err = mapErrorResponse({
      status: 403,
      body: {
        status: 'error',
        message: 'upgrade required',
        details: {
          feature: 'searchEndpoint',
          currentTier: 'community',
          requiredTier: 'professional',
          upgradeUrl: 'https://x/upgrade',
        },
      },
      url,
    }) as FeatureRestrictedError;
    expect(err.feature).toBe('searchEndpoint');
    expect(err.currentPlan).toBe('community');
    expect(err.requiredPlan).toBe('professional');
    expect(err.upgradeUrl).toBe('https://x/upgrade');
  });

  it('403 -> FeatureRestrictedError, extracting snake_case fields', () => {
    const err = mapErrorResponse({
      status: 403,
      body: { feature: 'search', current_plan: 'free', required_plan: 'pro', upgrade_url: 'https://x/upgrade' },
      url,
    }) as FeatureRestrictedError;
    expect(err.currentPlan).toBe('free');
    expect(err.requiredPlan).toBe('pro');
    expect(err.upgradeUrl).toBe('https://x/upgrade');
  });

  it('plan-gate 403 with no upgrade URL uses the default pricing URL', () => {
    const err = mapErrorResponse({ status: 403, body: { details: { feature: 'fuzzySearch' } }, url }) as FeatureRestrictedError;
    expect(err.upgradeUrl).toBe('https://countrystatecity.in/pricing');
  });

  it('non-plan 403 -> ForbiddenError without misleading upgrade advice', () => {
    const err = mapErrorResponse({ status: 403, body: { status: 'error', message: 'Domain not allowed' }, url });
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err).not.toBeInstanceOf(FeatureRestrictedError);
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

  it('429 -> RateLimitError from the canonical nested API envelope', () => {
    const err = mapErrorResponse({
      status: 429,
      body: {
        status: 'error',
        message: 'Daily limit reached',
        details: {
          limit: 3000,
          period: 'daily',
          resetAt: '2026-08-25T00:00:00.000Z',
          tier: 'community',
          upgradeUrl: 'https://countrystatecity.in/pricing',
        },
      },
      url,
    }) as RateLimitError;
    expect(err.limit).toBe(3000);
    expect(err.scope).toBe('daily');
    expect(err.resetAt).toBe('2026-08-25T00:00:00.000Z');
    expect(err.tier).toBe('community');
    expect(err.upgradeUrl).toBe('https://countrystatecity.in/pricing');
  });

  it('400 -> ValidationError from nested details', () => {
    const err = mapErrorResponse({
      status: 400,
      body: { status: 'error', message: 'invalid input', details: { field: 'limit', reason: 'out_of_range' } },
      url,
    }) as ValidationError;
    expect(err.field).toBe('limit');
    expect(err.reason).toBe('out_of_range');
  });

  it('400 preserves structured details needed to recover from an expired retention window', () => {
    const details = { earliestAvailableDate: '2026-05-26T00:00:00.000Z' };
    const err = mapErrorResponse({
      status: 400,
      body: { status: 'error', message: 'start_date is too old', details },
      url,
    }) as ValidationError;
    expect(err.details).toEqual(details);
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
