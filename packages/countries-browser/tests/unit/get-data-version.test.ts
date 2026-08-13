/**
 * Regression guard for getDataVersion(): it must never trigger a fetch of
 * country/state/city data, only the small version.json file (spec's
 * explicit "does not load all country or city data" rule).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDataVersion, clearCache } from '../../src/loaders';
import { configure, resetConfiguration } from '../../src/config';

const mockDataVersion = {
  dataVersion: 'v3.2-export.7-2026.07.29',
  sourceRelease: 'v3.2-export.7',
  updatedAt: '2026-07-29T09:01:18Z',
  recordCounts: { countries: 250, states: 5308, cities: 152970 },
};

beforeEach(() => {
  resetConfiguration();
  configure({ baseURL: 'https://cdn.test.com' });
  clearCache();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockDataVersion) }),
  );
});

describe('getDataVersion — no city/country data fetch', () => {
  it('fetches exactly once, and only version.json', async () => {
    await getDataVersion();

    expect(fetch).toHaveBeenCalledTimes(1);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe('https://cdn.test.com/data/version.json');
  });

  it('never fetches countries.json or any per-country/state/city file', async () => {
    await getDataVersion();

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toMatch(/countries\.json$/);
    expect(url).not.toMatch(/country\//);
    expect(url).not.toMatch(/states\//);
    expect(url).not.toMatch(/cities\//);
  });
});
