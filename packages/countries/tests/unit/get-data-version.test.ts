/**
 * Regression guard for getDataVersion(): it must never trigger a load of
 * country/state/city data, only the small version.json file (spec's
 * explicit "does not load all country or city data" rule).
 *
 * Note: loadJSON()'s dynamic-import branch succeeds in this Vitest
 * environment (unlike a raw Node CLI run, where its `assert: {type:"json"}`
 * clause is rejected and the fs fallback below is what actually executes in
 * production) — true for every loader here, not specific to this one. An
 * fs-only spy can therefore go quiet (0 calls) without proving anything
 * either way, so this file combines three independent signals instead of
 * relying on fs interception alone:
 *   1. The returned value exactly matches the real version.json on disk.
 *   2. It resolves fast — parsing the multi-MB countries.json, or any
 *      per-country/city file plus its directory-scan, would take measurably
 *      longer than a sub-1KB file.
 *   3. IF the fs fallback does fire (as it does outside Vitest), every path
 *      it touches is version.json — never countries/states/cities data.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import versionOnDisk from '../../src/data/version.json';

const fsSpy = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: (p: unknown, enc: unknown) => {
      fsSpy.calls.push(String(p));
      return (actual.readFileSync as (p: unknown, e: unknown) => string)(p, enc);
    },
  };
});

import { getDataVersion } from '../../src/loaders';

beforeEach(() => {
  fsSpy.calls = [];
});

describe('getDataVersion — no city/country data load', () => {
  it('returns exactly the real version.json content on disk', async () => {
    const result = await getDataVersion();
    expect(result).toEqual(versionOnDisk);
  });

  it('resolves fast enough that it cannot have parsed the full country/city dataset', async () => {
    const start = performance.now();
    await getDataVersion();
    const elapsed = performance.now() - start;
    // countries.json alone is several MB, and any per-country/state/city
    // file adds directory-scan I/O on top; version.json is a few hundred
    // bytes. 200ms is a generous ceiling even under slow/CI-loaded
    // conditions, but would be breached by loading far more than one small file.
    expect(elapsed).toBeLessThan(200);
  });

  it('if the fs fallback fires, every path it touches is version.json — never countries/states/cities data', async () => {
    await getDataVersion();

    if (fsSpy.calls.length === 0) {
      // Dynamic import succeeded (as for every loader in this environment) —
      // the fs fallback never ran, so there's nothing to assert here. The
      // two tests above cover correctness/behavior for that path instead.
      return;
    }
    expect(fsSpy.calls.every((p) => p.endsWith('version.json'))).toBe(true);
    expect(fsSpy.calls.some((p) => p.endsWith('countries.json'))).toBe(false);
    expect(fsSpy.calls.some((p) => p.endsWith('meta.json'))).toBe(false);
    expect(fsSpy.calls.some((p) => p.endsWith('cities.json'))).toBe(false);
    expect(fsSpy.calls.some((p) => p.endsWith('states.json'))).toBe(false);
  });
});
