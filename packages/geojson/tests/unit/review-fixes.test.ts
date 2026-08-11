/**
 * Regression tests for the confirmed findings of the PR #3 code review:
 * configure() clobbering defaults with undefined, config changes not
 * reaching the cache, shared mutable empty collections, cache poisoning
 * through returned references, and swallowed network/timeout errors.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCountriesGeoJSON,
  getStatesGeoJSON,
  getCitiesGeoJSON,
  clearCache,
} from '../../src/loaders';
import { configure, resetConfiguration, getConfig } from '../../src/config';
import { NetworkError, TimeoutError } from '../../src/errors';

function mockFetch(responses: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      }
    }
    return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
  }));
}

const mockStates = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [11, 21] },
      properties: { id: 10, name: 'TestState', iso2: 'TS', country_code: 'TC' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [12, 22] },
      properties: { id: 11, name: 'OtherState', iso2: 'OS', country_code: 'TC' },
    },
  ],
};

beforeEach(() => {
  resetConfiguration();
  configure({ baseURL: 'https://cdn.test.com' });
  clearCache();
  vi.restoreAllMocks();
  mockFetch({ 'states/TC.geojson': mockStates });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('configure()', () => {
  it('ignores explicitly-undefined options instead of clobbering defaults', () => {
    configure({ baseURL: 'https://mirror.test.com', timeout: undefined, cacheSize: undefined });
    expect(getConfig().baseURL).toBe('https://mirror.test.com');
    expect(getConfig().timeout).toBe(5000);
    expect(getConfig().cacheSize).toBe(50);
  });

  it('drops cached entries fetched from a previous baseURL', async () => {
    const statesFromMirror = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [1, 2] },
          properties: { id: 99, name: 'MirrorState', iso2: 'MS', country_code: 'TC' },
        },
      ],
    };
    const first = await getStatesGeoJSON('TC');
    expect(first.features[0].properties.name).toBe('TestState');

    mockFetch({ 'mirror.test.com': statesFromMirror });
    configure({ baseURL: 'https://mirror.test.com' });

    const second = await getStatesGeoJSON('TC');
    expect(second.features[0].properties.name).toBe('MirrorState');
  });
});

describe('returned collections are safe to mutate', () => {
  it('returns a fresh empty collection each time', async () => {
    const a = await getStatesGeoJSON('');
    a.features.push(mockStates.features[0] as never);
    const b = await getStatesGeoJSON('');
    expect(b.features).toHaveLength(0);
    const c = await getCitiesGeoJSON('ZZ', 'YY');
    expect(c.features).toHaveLength(0);
  });

  it('does not let caller mutation poison the cache', async () => {
    const a = await getStatesGeoJSON('TC');
    expect(a.features).toHaveLength(2);
    a.features.pop();
    const b = await getStatesGeoJSON('TC');
    expect(b.features).toHaveLength(2);
  });

  it('does not let nested feature mutation poison the cache', async () => {
    const a = await getStatesGeoJSON('TC');
    a.features[0].properties.name = 'CACHE-POISON';
    a.features[0].geometry.coordinates[0] = 999;
    const b = await getStatesGeoJSON('TC');
    expect(b.features[0].properties.name).toBe('TestState');
    expect(b.features[0].geometry.coordinates).toEqual([11, 21]);
  });
});

describe('error propagation', () => {
  it('propagates network failures instead of returning an empty collection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(getStatesGeoJSON('TC')).rejects.toThrow('fetch failed');
    await expect(getCitiesGeoJSON('TC', 'TS')).rejects.toThrow('fetch failed');
  });

  it('propagates timeouts as TimeoutError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')));
    await expect(getStatesGeoJSON('TC')).rejects.toBeInstanceOf(TimeoutError);
  });

  it('propagates non-404 HTTP errors as NetworkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' }));
    await expect(getStatesGeoJSON('TC')).rejects.toBeInstanceOf(NetworkError);
  });

  it('still returns an empty collection for a genuine 404', async () => {
    expect(await getStatesGeoJSON('ZZ')).toEqual({ type: 'FeatureCollection', features: [] });
    expect(await getCitiesGeoJSON('ZZ', 'YY')).toEqual({ type: 'FeatureCollection', features: [] });
  });
});

describe('countries collection cache safety', () => {
  it('does not let mutation of the countries collection poison the cache', async () => {
    const countries = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [10, 20] },
          properties: { id: 1, name: 'TestCountry', iso2: 'TC', iso3: 'TST' },
        },
      ],
    };
    mockFetch({ 'countries.geojson': countries });
    const a = await getCountriesGeoJSON();
    a.features.pop();
    const b = await getCountriesGeoJSON();
    expect(b.features).toHaveLength(1);
  });
});
