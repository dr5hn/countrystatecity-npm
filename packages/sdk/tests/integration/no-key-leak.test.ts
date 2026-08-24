import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../src/client';
import { installMockCscApi } from './support/mockCscApi';

const SECRET = 'INTEGRATION_SECRET_KEY_7c2e';

afterEach(() => {
  vi.unstubAllGlobals();
});

function serializeError(err: unknown): string {
  if (!(err instanceof Error)) return JSON.stringify(err);
  return JSON.stringify(err, Object.getOwnPropertyNames(err)) + err.stack;
}

describe('no-key-leak — full round trip through a mocked failure', () => {
  it('a persistent 500 exhausts retries without the key appearing anywhere in the thrown error', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/countries': { status: 500, body: { message: 'boom' } } });
    const csc = createCSCClient({ apiKey: SECRET, baseUrl: 'https://mock.test/v1', retry: { retries: 1, baseDelayMs: 1, maxDelayMs: 1 } });

    try {
      await csc.countries.list();
      expect.unreachable();
    } catch (err) {
      expect(serializeError(err)).not.toContain(SECRET);
    }

    // Positive control: every outgoing request DID carry the key, just in the header, not the URL/body/error.
    for (const call of fetchMock.mock.calls) {
      const [url, init] = call as [string, RequestInit];
      expect(url).not.toContain(SECRET);
      expect((init.headers as Record<string, string>)['X-CSCAPI-KEY']).toBe(SECRET);
    }
  });
});
