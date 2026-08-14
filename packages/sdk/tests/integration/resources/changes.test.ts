import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError, FeatureRestrictedError, NotFoundError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import { SAMPLE_CHANGE_FEED_PAGE } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changes — integration', () => {
  it('resolves a change feed page end-to-end, as an object (not a bare array)', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/changes': { body: SAMPLE_CHANGE_FEED_PAGE } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const result = await csc.changes.list({ startDate: '2026-08-01T00:00:00Z', placeType: 'city' });
    expect(result.data).toEqual(SAMPLE_CHANGE_FEED_PAGE);
    expect(result.data.results[0].change_type).toBe('renamed');
    expect(result.data.next_page_token).toBeNull();

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('start_date=');
    expect(url).toContain('place_type=city');
  });

  it('surfaces FeatureRestrictedError for accounts below Business tier', async () => {
    installMockCscApi({
      '/v1/changes': { status: 403, body: { message: 'This endpoint requires the Business plan.', requiredPlan: 'Business' } },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.changes.list()).rejects.toBeInstanceOf(FeatureRestrictedError);
  });

  it('surfaces NotFoundError, not a crash, when the endpoint is not yet available on an account', async () => {
    installMockCscApi({ '/v1/changes': { status: 404, body: { resource: 'changes' } } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.changes.list()).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a malformed startDate before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/changes': { body: SAMPLE_CHANGE_FEED_PAGE } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.changes.list({ startDate: 'not-a-date' })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('paginates with nextPageToken alone', async () => {
    const { fetchMock } = installMockCscApi({
      '/v1/changes': { body: { results: [], next_page_token: null } },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await csc.changes.list({ nextPageToken: 'tok_abc' });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('next_page_token=tok_abc');
  });
});
