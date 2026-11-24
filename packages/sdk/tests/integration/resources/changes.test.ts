import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { FeatureRestrictedError, ValidationError } from '../../../src/errors';
import { SAMPLE_CHANGE_FEED_PAGE } from '../support/fixtures';
import { installMockCscApi } from '../support/mockCscApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changes — integration', () => {
  it('returns the cursor-paginated object and sends the finalized filters', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/changes': { body: SAMPLE_CHANGE_FEED_PAGE } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const response = await csc.changes.list({
      startDate: '2026-08-01T00:00:00Z',
      placeType: 'city',
      countryCode: 'in',
      changeType: 'renamed',
      limit: 50,
    });

    expect(response.data).toEqual(SAMPLE_CHANGE_FEED_PAGE);
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      start_date: '2026-08-01T00:00:00.000Z',
      place_type: 'city',
      country_code: 'IN',
      change_type: 'renamed',
      limit: '50',
    });
  });

  it.each(['county', 'postcode'] as const)('retains %s events and cursor pages', async (placeType) => {
    const page = { results: [{ ...SAMPLE_CHANGE_FEED_PAGE.results[0], place_type: placeType,
      place_id: '9007199254740993', old_values: null,
      new_values: placeType === 'county' ? { states: [{ id: '1', name: 'A', code: 'A' }] } : { code: '11104', city_id: null } }],
    next_page_token: 'opaque_next_page' };
    const { fetchMock } = installMockCscApi({ '/v1/changes': { body: page } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });
    const response = await csc.changes.list({ placeType });
    expect(response.data).toEqual(page);
    expect(new URL(fetchMock.mock.calls[0][0] as string).searchParams.get('place_type')).toBe(placeType);
    await csc.changes.list({ nextPageToken: response.data.next_page_token! });
    expect(new URL(fetchMock.mock.calls[1][0] as string).searchParams.get('next_page_token')).toBe('opaque_next_page');
  });

  it('maps the Professional-plan gate to FeatureRestrictedError', async () => {
    installMockCscApi({
      '/v1/changes': {
        status: 403,
        body: {
          status: 'error',
          message: 'This feature is not available on your current plan.',
          details: {
            feature: 'dataChangeFeed',
            currentTier: 'supporter',
            requiredTier: 'professional',
            upgradeUrl: 'https://countrystatecity.in/pricing',
          },
        },
      },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.changes.list()).rejects.toMatchObject<Partial<FeatureRestrictedError>>({
      feature: 'dataChangeFeed',
      currentPlan: 'supporter',
      requiredPlan: 'professional',
    });
  });

  it('keeps earliestAvailableDate on retention errors', async () => {
    installMockCscApi({
      '/v1/changes': {
        status: 400,
        body: {
          status: 'error',
          message: 'start_date is older than the earliest available change.',
          details: { earliestAvailableDate: '2026-05-26T00:00:00.000Z' },
        },
      },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.changes.list()).rejects.toMatchObject<Partial<ValidationError>>({
      details: { earliestAvailableDate: '2026-05-26T00:00:00.000Z' },
    });
  });
});
