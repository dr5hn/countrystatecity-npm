import { describe, it, expect } from 'vitest';
import {
  CSCError,
  AuthenticationError,
  ForbiddenError,
  ValidationError,
  FeatureRestrictedError,
  RateLimitError,
  NotFoundError,
  NetworkError,
  TimeoutError,
} from '../../src/errors';

describe('error hierarchy', () => {
  it('every subclass is an instanceof CSCError and Error, with the right name', () => {
    const cases: Array<[Error, string]> = [
      [new AuthenticationError('x'), 'AuthenticationError'],
      [new ForbiddenError('x'), 'ForbiddenError'],
      [new ValidationError('x'), 'ValidationError'],
      [new FeatureRestrictedError('x'), 'FeatureRestrictedError'],
      [new RateLimitError('x'), 'RateLimitError'],
      [new NotFoundError('x'), 'NotFoundError'],
      [new NetworkError('x'), 'NetworkError'],
      [new TimeoutError('x', 5000), 'TimeoutError'],
    ];

    for (const [err, name] of cases) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(CSCError);
      expect(err.name).toBe(name);
    }
  });

  it('CSCError carries statusCode/requestId/url/cause and retryCount is settable', () => {
    const cause = new Error('boom');
    const err = new CSCError('failed', { statusCode: 500, requestId: 'req_1', url: 'https://x/y', cause });
    expect(err.statusCode).toBe(500);
    expect(err.requestId).toBe('req_1');
    expect(err.url).toBe('https://x/y');
    expect(err.cause).toBe(cause);
    expect(err.retryCount).toBeUndefined();

    err.retryCount = 2;
    expect(err.retryCount).toBe(2);
  });

  it('ValidationError carries field/value/reason/details', () => {
    const details = { earliestAvailableDate: '2026-05-26T00:00:00.000Z' };
    const err = new ValidationError('bad country', { field: 'country', value: 'ZZZ', reason: 'invalid_iso2_format', details });
    expect(err.field).toBe('country');
    expect(err.value).toBe('ZZZ');
    expect(err.reason).toBe('invalid_iso2_format');
    expect(err.details).toBe(details);
  });

  it('FeatureRestrictedError defaults upgradeUrl when the API omits it', () => {
    const err = new FeatureRestrictedError('nope', { feature: 'search', currentPlan: 'free', requiredPlan: 'pro' });
    expect(err.feature).toBe('search');
    expect(err.currentPlan).toBe('free');
    expect(err.requiredPlan).toBe('pro');
    expect(err.upgradeUrl).toBe('https://countrystatecity.in/pricing');
  });

  it('FeatureRestrictedError keeps an API-supplied upgradeUrl', () => {
    const err = new FeatureRestrictedError('nope', { upgradeUrl: 'https://example.com/upgrade' });
    expect(err.upgradeUrl).toBe('https://example.com/upgrade');
  });

  it('RateLimitError carries quota and upgrade details', () => {
    const err = new RateLimitError('slow down', {
      limit: 1000,
      remaining: 0,
      resetAt: '2026-08-13T00:00:00Z',
      retryAfter: 60,
      scope: 'daily',
      tier: 'community',
      upgradeUrl: 'https://countrystatecity.in/pricing',
    });
    expect(err.limit).toBe(1000);
    expect(err.remaining).toBe(0);
    expect(err.resetAt).toBe('2026-08-13T00:00:00Z');
    expect(err.retryAfter).toBe(60);
    expect(err.scope).toBe('daily');
    expect(err.tier).toBe('community');
    expect(err.upgradeUrl).toBe('https://countrystatecity.in/pricing');
  });

  it('NotFoundError carries resource/identifier', () => {
    const err = new NotFoundError('missing', { resource: 'country', identifier: 'ZZ' });
    expect(err.resource).toBe('country');
    expect(err.identifier).toBe('ZZ');
  });

  it('TimeoutError carries timeoutMs', () => {
    const err = new TimeoutError('too slow', 10_000);
    expect(err.timeoutMs).toBe(10_000);
  });
});
