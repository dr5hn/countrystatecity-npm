import { describe, it, expect } from 'vitest';
import { extractMeta } from '../../../src/http/extractMeta';

describe('extractMeta', () => {
  it('extracts a full header set', () => {
    const headers = new Headers({
      'x-request-id': 'req_1',
      'x-csc-daily-used': '10',
      'x-csc-daily-limit': '1000',
      'x-csc-monthly-used': '200',
      'x-csc-monthly-limit': '30000',
      'x-csc-data-version': '2026-08-01',
      'x-csc-cache': 'HIT',
      'x-csc-total-count': '250',
      'x-csc-limit': '50',
      'x-csc-offset': '0',
    });

    const meta = extractMeta(headers, 1);

    expect(meta).toEqual({
      requestId: 'req_1',
      rateLimit: { dailyUsed: 10, dailyLimit: 1000, monthlyUsed: 200, monthlyLimit: 30000 },
      dataVersion: '2026-08-01',
      cache: 'HIT',
      pagination: { total: 250, limit: 50, offset: 0, hasMore: true },
      retryCount: 1,
    });
  });

  it('leaves fields undefined field-by-field when headers are partial (never all-or-nothing)', () => {
    const headers = new Headers({ 'x-csc-daily-used': '5' });
    const meta = extractMeta(headers, 0);

    expect(meta.rateLimit).toEqual({
      dailyUsed: 5,
      dailyLimit: undefined,
      monthlyUsed: undefined,
      monthlyLimit: undefined,
    });
    expect(meta.requestId).toBeUndefined();
    expect(meta.pagination).toBeUndefined();
    expect(meta.cache).toBeUndefined();
  });

  it('returns an empty-ish meta when no relevant headers are present', () => {
    const meta = extractMeta(new Headers(), 0);
    expect(meta).toEqual({
      requestId: undefined,
      rateLimit: undefined,
      dataVersion: undefined,
      cache: undefined,
      pagination: undefined,
      retryCount: 0,
    });
  });

  it('ignores an unrecognized cache header value', () => {
    const headers = new Headers({ 'x-csc-cache': 'WEIRD' });
    expect(extractMeta(headers, 0).cache).toBeUndefined();
  });

  it('computes hasMore: false when offset+limit reaches total', () => {
    const headers = new Headers({ 'x-csc-total-count': '10', 'x-csc-limit': '10', 'x-csc-offset': '0' });
    expect(extractMeta(headers, 0).pagination?.hasMore).toBe(false);
  });

  it('falls back to x-csc-request-id when x-request-id is absent', () => {
    const headers = new Headers({ 'x-csc-request-id': 'req_2' });
    expect(extractMeta(headers, 0).requestId).toBe('req_2');
  });
});
