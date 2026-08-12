import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '../../../src/http/httpClient';
import type { ResolvedCSCConfig } from '../../../src/types/config';

function makeConfig(overrides: Partial<ResolvedCSCConfig> = {}): ResolvedCSCConfig {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://api.countrystatecity.in/v1',
    timeout: 1000,
    fetchImpl: (async () => new Response('{}', { status: 200 })) as unknown as typeof fetch,
    headers: {},
    retry: { retries: 2, baseDelayMs: 1, maxDelayMs: 1 },
    userAgent: 'countrystatecity-sdk-js/test',
    ...overrides,
  };
}

/** Mimics real fetch's behavior of rejecting with a DOMException AbortError when its signal fires, and never resolving otherwise. */
function neverResolvingFetch(): typeof fetch {
  return vi.fn((_url: string, init?: RequestInit) => {
    return new Promise((_resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
        return;
      }
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    });
  }) as unknown as typeof fetch;
}

describe('HttpClient.request — success path', () => {
  it('returns { data, meta } with retryCount 0 on the first try', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([{ id: 1 }]), { status: 200 })) as unknown as typeof fetch;
    const http = new HttpClient(makeConfig({ fetchImpl }));

    const result = await http.request<Array<{ id: number }>>(['countries']);

    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.meta.retryCount).toBe(0);
  });

  it('getLastMeta() reflects the most recent successful response', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('{}', { status: 200, headers: { 'x-request-id': 'req_1' } }),
    ) as unknown as typeof fetch;
    const http = new HttpClient(makeConfig({ fetchImpl }));

    expect(http.getLastMeta()).toBeUndefined();
    await http.request(['countries']);
    expect(http.getLastMeta()?.requestId).toBe('req_1');
  });
});

describe('HttpClient.request — headers', () => {
  it('protected headers (auth, accept, user-agent) always win over user-supplied ones', async () => {
    let captured: Record<string, string> = {};
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      captured = init?.headers as Record<string, string>;
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;

    const http = new HttpClient(
      makeConfig({
        fetchImpl,
        apiKey: 'real-key',
        userAgent: 'real-agent/1.0',
        headers: { 'X-CSCAPI-KEY': 'evil-from-config', Accept: 'text/plain', 'X-Custom': 'yes' },
      }),
    );

    await http.request(['countries'], undefined, { headers: { 'User-Agent': 'evil-from-call', 'X-Another': 'ok' } });

    expect(captured['X-CSCAPI-KEY']).toBe('real-key');
    expect(captured['Accept']).toBe('application/json');
    expect(captured['User-Agent']).toBe('real-agent/1.0');
    expect(captured['X-Custom']).toBe('yes');
    expect(captured['X-Another']).toBe('ok');
  });
});

describe('HttpClient.request — retry behavior', () => {
  it('retries transient 5xx and succeeds, reporting retryCount', async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call++;
      if (call <= 2) return new Response(JSON.stringify({ message: 'boom' }), { status: 500 });
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    }) as unknown as typeof fetch;

    const http = new HttpClient(makeConfig({ fetchImpl, retry: { retries: 2, baseDelayMs: 1, maxDelayMs: 1 } }));
    const result = await http.request(['countries', 'IN']);

    expect(result.data).toEqual({ id: 1 });
    expect(result.meta.retryCount).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('exhausts retries on a persistent 5xx and throws NetworkError with retryCount set', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ message: 'boom' }), { status: 503 }),
    ) as unknown as typeof fetch;
    const http = new HttpClient(makeConfig({ fetchImpl, retry: { retries: 2, baseDelayMs: 1, maxDelayMs: 1 } }));

    await expect(http.request(['countries'])).rejects.toMatchObject({
      name: 'NetworkError',
      statusCode: 503,
      retryCount: 2,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('never retries a 404', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ resource: 'country', identifier: 'ZZ' }), { status: 404 }),
    ) as unknown as typeof fetch;
    const http = new HttpClient(makeConfig({ fetchImpl }));

    await expect(http.request(['countries', 'ZZ'])).rejects.toMatchObject({ name: 'NotFoundError' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('never retries a 401 or 403', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
    const http = new HttpClient(makeConfig({ fetchImpl }));
    await expect(http.request(['countries'])).rejects.toMatchObject({ name: 'AuthenticationError' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retry: false disables retries entirely, even on a 5xx', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 500 })) as unknown as typeof fetch;
    const http = new HttpClient(makeConfig({ fetchImpl, retry: false }));

    await expect(http.request(['countries'])).rejects.toMatchObject({ retryCount: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('a 429 with Retry-After: 0 resolves near-instantly instead of waiting out a large computed backoff', async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call++;
      if (call === 1) {
        return new Response(JSON.stringify({ message: 'slow down' }), { status: 429, headers: { 'retry-after': '0' } });
      }
      return new Response(JSON.stringify([{ id: 1 }]), { status: 200 });
    }) as unknown as typeof fetch;

    // A huge base delay: if Retry-After weren't taking precedence, this attempt would very
    // likely sleep for hundreds/thousands of ms instead of the ~0ms Retry-After specifies.
    const http = new HttpClient(makeConfig({ fetchImpl, retry: { retries: 2, baseDelayMs: 100_000, maxDelayMs: 100_000 } }));

    const start = Date.now();
    const result = await http.request(['countries']);
    const elapsed = Date.now() - start;

    expect(result.data).toEqual([{ id: 1 }]);
    expect(elapsed).toBeLessThan(2000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('HttpClient.request — timeouts and cancellation', () => {
  it('throws TimeoutError (retryable) when a request exceeds its per-attempt timeout', async () => {
    const fetchImpl = neverResolvingFetch();
    const http = new HttpClient(makeConfig({ fetchImpl, timeout: 20, retry: { retries: 1, baseDelayMs: 1, maxDelayMs: 1 } }));

    await expect(http.request(['countries'])).rejects.toMatchObject({ name: 'TimeoutError', timeoutMs: 20 });
    expect(fetchImpl).toHaveBeenCalledTimes(2); // initial attempt + 1 retry
  });

  it('opts.timeout overrides the client default for a single call', async () => {
    const fetchImpl = neverResolvingFetch();
    const http = new HttpClient(makeConfig({ fetchImpl, timeout: 100_000, retry: { retries: 0, baseDelayMs: 1, maxDelayMs: 1 } }));

    await expect(http.request(['countries'], undefined, { timeout: 15 })).rejects.toMatchObject({
      name: 'TimeoutError',
      timeoutMs: 15,
    });
  });

  it('rethrows a caller-initiated AbortSignal abort untouched, and never retries it', async () => {
    const fetchImpl = neverResolvingFetch();
    const http = new HttpClient(makeConfig({ fetchImpl, timeout: 5000, retry: { retries: 2, baseDelayMs: 1, maxDelayMs: 1 } }));
    const controller = new AbortController();
    controller.abort();

    await expect(http.request(['countries'], undefined, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
