import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchJSON } from '../../src/fetcher';
import { resetConfiguration, configure } from '../../src/config';
import { NetworkError, TimeoutError } from '../../src/errors';

describe('fetchJSON', () => {
  beforeEach(() => {
    resetConfiguration();
    configure({ baseURL: 'https://cdn.test.com' });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses JSON', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const result = await fetchJSON('/data/countries.json');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.test.com/data/countries.json',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Accept': 'application/json' }),
      }),
    );
  });

  it('throws NetworkError on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }));

    await expect(fetchJSON('/data/missing.json'))
      .rejects
      .toThrow(NetworkError);
  });

  it('includes status code in NetworkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }));

    try {
      await fetchJSON('/data/broken.json');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkError);
      expect((error as NetworkError).statusCode).toBe(500);
      expect((error as NetworkError).url).toBe('https://cdn.test.com/data/broken.json');
    }
  });

  it('passes custom headers from config', async () => {
    configure({ baseURL: 'https://cdn.test.com', headers: { 'X-Api-Key': 'secret' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }));

    await fetchJSON('/data/countries.json');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Api-Key': 'secret' }),
      }),
    );
  });

  it('throws on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(fetchJSON('/data/countries.json'))
      .rejects
      .toThrow(TypeError);
  });

  it('throws TimeoutError on abort timeout', async () => {
    const domError = new DOMException('Signal timed out', 'TimeoutError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(domError));

    try {
      await fetchJSON('/data/countries.json');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as any).timeout).toBe(5000);
    }
  });
});
