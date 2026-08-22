import { vi } from 'vitest';
import type { HttpClient } from '../../../src/http/httpClient';
import type { CSCResponse, CSCResponseMeta } from '../../../src/types/response';

export type FakeHttpClient = HttpClient & {
  request: ReturnType<typeof vi.fn>;
  getLastMeta: ReturnType<typeof vi.fn>;
};

const DEFAULT_META: CSCResponseMeta = { retryCount: 0 };

export function createFakeHttp<T = unknown>(response?: CSCResponse<T>): FakeHttpClient {
  const resolved: CSCResponse<unknown> = response ?? { data: null, meta: DEFAULT_META };
  return {
    request: vi.fn().mockResolvedValue(resolved),
    getLastMeta: vi.fn().mockReturnValue(undefined),
  } as unknown as FakeHttpClient;
}
