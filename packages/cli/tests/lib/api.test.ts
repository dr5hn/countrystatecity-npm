import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config
vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(() => 'test-api-key'),
  getApiBase: vi.fn(() => 'https://api.countrystatecity.in/v1'),
}));

// Mock chalk to pass through
vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
  },
}));

import { get, validateKey } from '../../src/lib/api.js';
import { getApiKey } from '../../src/lib/config.js';

function stubFetch(status: number, body: unknown, headers?: Record<string, string>) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function stubFetchError(error: Error) {
  const fetchMock = vi.fn().mockRejectedValue(error);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('makes authenticated GET requests with correct headers', async () => {
    const fetchMock = stubFetch(200, { name: 'India' });

    const result = await get('/countries/IN');
    expect(result.data).toEqual({ name: 'India' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.countrystatecity.in/v1/countries/IN');
    expect((init.headers as Record<string, string>)['X-CSCAPI-KEY']).toBe('test-api-key');
  });

  it('extracts usage info from response headers', async () => {
    stubFetch(200, {}, {
      'x-csc-daily-used': '47',
      'x-csc-daily-limit': '1000',
      'x-csc-monthly-used': '1230',
      'x-csc-monthly-limit': '30000',
    });

    const result = await get('/countries/IN');
    expect(result.usage).toEqual({
      dailyUsed: 47,
      dailyLimit: 1000,
      monthlyUsed: 1230,
      monthlyLimit: 30000,
    });
  });

  it('returns null usage when headers are missing', async () => {
    stubFetch(200, {});

    const result = await get('/countries/IN');
    expect(result.usage).toBeNull();
  });

  it('returns null usage when only some headers present', async () => {
    stubFetch(200, {}, {
      'x-csc-daily-used': '47',
      'x-csc-daily-limit': '1000',
    });

    const result = await get('/countries/IN');
    expect(result.usage).toBeNull();
  });

  it('exits on 401 error', async () => {
    stubFetch(401, { message: 'Unauthorized' });
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('exits on 429 error', async () => {
    stubFetch(429, { message: 'Too Many Requests' });
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  }, 10000);

  it('exits on 404 error', async () => {
    stubFetch(404, { message: 'Not Found' });
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('exits on network error', async () => {
    stubFetchError(new Error('ECONNREFUSED'));
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  }, 10000);

  it('exits on client-side validation error (malformed input) without making a request', async () => {
    const fetchMock = stubFetch(200, {});
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    // 'USA' is not a valid 2-letter ISO code — the SDK rejects it before any
    // network call is made, unlike today's server round-trip to a 404.
    await expect(get('/countries/USA')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('exits when no API key is configured', async () => {
    vi.mocked(getApiKey).mockReturnValueOnce(undefined);
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  describe('path dispatcher', () => {
    const cases: Array<[string, string]> = [
      ['/countries', 'https://api.countrystatecity.in/v1/countries'],
      ['/countries/IN', 'https://api.countrystatecity.in/v1/countries/IN'],
      ['/countries/IN/states', 'https://api.countrystatecity.in/v1/countries/IN/states'],
      ['/states', 'https://api.countrystatecity.in/v1/states'],
      ['/countries/IN/states/MH', 'https://api.countrystatecity.in/v1/countries/IN/states/MH'],
      ['/countries/IN/states/MH/cities', 'https://api.countrystatecity.in/v1/countries/IN/states/MH/cities'],
      ['/countries/IN/cities', 'https://api.countrystatecity.in/v1/countries/IN/cities'],
      ['/regions', 'https://api.countrystatecity.in/v1/regions'],
    ];

    it.each(cases)('routes %s to the correct SDK request URL', async (path, expectedUrl) => {
      const fetchMock = stubFetch(200, []);

      await get(path);

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl.split('?')[0]).toBe(expectedUrl);
    });
  });

  describe('validateKey', () => {
    it('returns valid:true for successful validation', async () => {
      stubFetch(200, { name: 'India' }, {
        'x-csc-daily-used': '10',
        'x-csc-daily-limit': '1000',
        'x-csc-monthly-used': '100',
        'x-csc-monthly-limit': '30000',
      });

      const result = await validateKey('valid-key');
      expect(result.valid).toBe(true);
      expect(result.usage).toBeDefined();
    });

    it('returns valid:false for failed validation', async () => {
      stubFetch(401, { message: 'Unauthorized' });

      const result = await validateKey('invalid-key');
      expect(result.valid).toBe(false);
      expect(result.usage).toBeNull();
    });
  });
});
