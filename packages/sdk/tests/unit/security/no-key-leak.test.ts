import { describe, it, expect, vi, afterEach } from 'vitest';
import { createCSCClient } from '../../../src/client';

const SECRET = 'SUPER_SECRET_TEST_KEY_9f3a1c';

afterEach(() => {
  vi.unstubAllGlobals();
});

function serializeError(err: unknown): string {
  if (!(err instanceof Error)) return JSON.stringify(err);
  return JSON.stringify(err, Object.getOwnPropertyNames(err)) + err.stack;
}

describe('the API key never leaks', () => {
  it('is sent only in the X-CSCAPI-KEY header — never in the URL (positive + negative control)', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const csc = createCSCClient({ apiKey: SECRET });
    await csc.countries.list();
    await csc.search.fuzzy({ query: 'test' });

    for (const call of fetchMock.mock.calls) {
      const [url, init] = call as [string, RequestInit];
      expect(url).not.toContain(SECRET);
      expect((init.headers as Record<string, string>)['X-CSCAPI-KEY']).toBe(SECRET); // positive control: it IS sent, just not in the URL
    }
  });

  it.each([
    [401, { message: 'Invalid key' }],
    [403, { message: 'Restricted', feature: 'search' }],
    [429, { message: 'Slow down' }],
    [404, { message: 'Not found' }],
  ])('never appears in a thrown error for a %i response, even when the body echoes request-ish data', async (status, body) => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ ...body, echo: `key=${SECRET}` }), { status: status as number }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const csc = createCSCClient({ apiKey: SECRET, retry: false });

    try {
      await csc.countries.get('IN');
      expect.unreachable();
    } catch (err) {
      // The mapper only reads known fields (message/feature/etc.), so an echoed key in an
      // unrecognized body field must not end up on the error — this also guards against a
      // future mapper change accidentally forwarding arbitrary body content.
      expect(serializeError(err)).not.toContain(SECRET);
    }
  });

  it('never appears in the terminal error after retries are exhausted on a persistent 5xx', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: 'boom' }), { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    const csc = createCSCClient({ apiKey: SECRET, retry: { retries: 1, baseDelayMs: 1, maxDelayMs: 1 } });

    try {
      await csc.countries.list();
      expect.unreachable();
    } catch (err) {
      expect(serializeError(err)).not.toContain(SECRET);
    }
  });

  it('never appears in a client-side ValidationError message for bad input', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const csc = createCSCClient({ apiKey: SECRET });

    try {
      await csc.countries.get('NOT_A_CODE');
      expect.unreachable();
    } catch (err) {
      expect(serializeError(err)).not.toContain(SECRET);
    }
  });
});
