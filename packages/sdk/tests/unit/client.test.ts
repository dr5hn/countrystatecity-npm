import { describe, it, expect, vi, afterEach } from 'vitest';
import { createCSCClient, CSCClient } from '../../src/client';
import { ValidationError } from '../../src/errors';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetchOk(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('createCSCClient', () => {
  it('returns a CSCClient with every documented resource group', () => {
    stubFetchOk();
    const csc = createCSCClient({ apiKey: 'k' });
    expect(csc).toBeInstanceOf(CSCClient);
    for (const key of ['countries', 'states', 'cities', 'regions', 'currencies', 'iso', 'phone', 'timezones', 'search', 'usage', 'changes'] as const) {
      expect(csc[key]).toBeDefined();
    }
  });

  it('throws ValidationError when apiKey is missing or empty', () => {
    expect(() => createCSCClient({ apiKey: '' })).toThrow(ValidationError);
    // @ts-expect-error deliberately omitting the required field
    expect(() => createCSCClient({})).toThrow(ValidationError);
  });

  it('throws ValidationError when baseUrl is not an absolute URL', () => {
    stubFetchOk();
    // Otherwise this surfaces as a bare TypeError from new URL() on the first
    // request, long after the misconfiguration.
    expect(() => createCSCClient({ apiKey: 'k', baseUrl: 'api.countrystatecity.in/v1' })).toThrow(ValidationError);
    expect(() => createCSCClient({ apiKey: 'k', baseUrl: '' })).toThrow(ValidationError);
  });

  it('calls the global fetch with the global as its receiver', async () => {
    // Browsers implement fetch as a WebIDL operation that rejects a foreign
    // `this` with "Illegal invocation"; storing the bare reference on the
    // config object and calling it as config.fetchImpl(...) triggers exactly
    // that. Node does not enforce it, so assert the receiver directly.
    const receivers: unknown[] = [];
    const fetchMock = vi.fn(function (this: unknown) {
      receivers.push(this);
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const csc = createCSCClient({ apiKey: 'k' });
    await csc.countries.list();

    expect(receivers).toHaveLength(1);
    expect(receivers[0] === globalThis || receivers[0] === undefined).toBe(true);
  });

  it('uses the default base URL and a versioned default User-Agent', async () => {
    const fetchMock = stubFetchOk();
    const csc = createCSCClient({ apiKey: 'k' });
    await csc.countries.list();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.countrystatecity.in/v1/countries');
    expect((init.headers as Record<string, string>)['User-Agent']).toMatch(/^countrystatecity-sdk-js\//);
    expect((init.headers as Record<string, string>)['X-CSCAPI-KEY']).toBe('k');
  });

  it('honors a custom baseUrl, headers, and userAgent', async () => {
    const fetchMock = stubFetchOk();
    const csc = createCSCClient({
      apiKey: 'k',
      baseUrl: 'https://sandbox.example.com/v2',
      headers: { 'X-Trace': 'abc' },
      userAgent: 'my-app/1.0',
    });
    await csc.countries.list();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith('https://sandbox.example.com/v2/countries')).toBe(true);
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Trace']).toBe('abc');
    expect(headers['User-Agent']).toBe('my-app/1.0');
  });

  it('uses a custom fetch implementation instead of the global one', async () => {
    const globalFetch = stubFetchOk();
    const customFetch = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));

    const csc = createCSCClient({ apiKey: 'k', fetch: customFetch as unknown as typeof fetch });
    await csc.countries.list();

    expect(customFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch).not.toHaveBeenCalled();
  });

  it('getLastResponseMeta() is undefined before any request and populated after', async () => {
    stubFetchOk();
    const csc = createCSCClient({ apiKey: 'k' });
    expect(csc.getLastResponseMeta()).toBeUndefined();

    await csc.countries.list();
    expect(csc.getLastResponseMeta()).toBeDefined();
  });
});
