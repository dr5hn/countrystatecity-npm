/**
 * A minimal stand-in "test API environment": stubs global fetch with a
 * routing table keyed by pathname, so the *real* CSCClient / HttpClient /
 * retry code path runs end-to-end against canned responses — no live network.
 *
 * Generalizes the fetch-stubbing pattern already used in
 * packages/geojson/tests/integration/api.test.ts (vi.stubGlobal('fetch', ...)).
 */

import { vi } from 'vitest';

export interface MockRoute {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  delayMs?: number;
  /** This route fails (with failStatus/failBody) this many times before succeeding. */
  failTimes?: number;
  failStatus?: number;
  failBody?: unknown;
}

export type RouteTable = Record<string, MockRoute>;

export interface MockCscApi {
  fetchMock: ReturnType<typeof vi.fn>;
  callCount: (pathname: string) => number;
}

export function installMockCscApi(routes: RouteTable): MockCscApi {
  const counts: Record<string, number> = {};

  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const { pathname } = new URL(url);
    counts[pathname] = (counts[pathname] ?? 0) + 1;
    const callNumber = counts[pathname];

    const route = routes[pathname];
    if (!route) {
      return new Response(JSON.stringify({ message: `no mock route registered for ${pathname}` }), { status: 404 });
    }

    if (route.delayMs) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, route.delayMs);
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    }

    if (route.failTimes && callNumber <= route.failTimes) {
      return new Response(JSON.stringify(route.failBody ?? { message: 'transient failure' }), {
        status: route.failStatus ?? 500,
      });
    }

    return new Response(JSON.stringify(route.body ?? null), {
      status: route.status ?? 200,
      headers: route.headers,
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return { fetchMock, callCount: (pathname: string) => counts[pathname] ?? 0 };
}
