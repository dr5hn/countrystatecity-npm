/**
 * Regression tests for the confirmed findings of the PR #3 code review:
 * path traversal, case normalization, null locality_name, error
 * swallowing, and missing caching in the postalcodes loaders.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Passthrough fs mock: records every readFileSync path and lets individual
// tests inject a fake file body for paths matching a marker.
const fsSpy = vi.hoisted(() => ({
  calls: [] as string[],
  impl: null as null | ((path: string) => string | null),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: (p: unknown, enc: unknown) => {
      const pathStr = String(p);
      fsSpy.calls.push(pathStr);
      if (fsSpy.impl) {
        const fake = fsSpy.impl(pathStr);
        if (fake !== null) return fake;
      }
      return (actual.readFileSync as (p: unknown, e: unknown) => string)(p, enc);
    },
  };
});

import {
  getPostalCodesOfState,
  getUnassignedPostalCodesOfCountry,
  getAllPostalCodesOfCountry,
  getManifest,
  clearCache,
} from '../../src/loaders';
import {
  validatePostalCode,
  searchPostalCodesByLocality,
  searchPostalCodesByLocalityInCountry,
} from '../../src/utils';

beforeEach(() => {
  fsSpy.calls = [];
  fsSpy.impl = null;
  clearCache();
});

describe('input validation (path traversal)', () => {
  it('returns [] for a traversal-shaped country code instead of reading outside data/', async () => {
    // './data/../package.json' resolves to the package's own package.json,
    // which exists and parses — the unpatched code returns its contents.
    const result = await getPostalCodesOfState('..', 'package');
    expect(result).toEqual([]);
  });

  it('never touches the filesystem for syntactically invalid codes', async () => {
    await getPostalCodesOfState('../../..', 'secrets');
    await getUnassignedPostalCodesOfCountry('../..');
    expect(fsSpy.calls).toEqual([]);
  });
});

describe('code case normalization', () => {
  it('getAllPostalCodesOfCountry accepts lowercase country codes', async () => {
    const lower = await getAllPostalCodesOfCountry('ad');
    const upper = await getAllPostalCodesOfCountry('AD');
    expect(upper.length).toBeGreaterThan(0);
    expect(lower.length).toBe(upper.length);
  });

  it('validatePostalCode accepts lowercase country codes', async () => {
    expect(await validatePostalCode('ad', 'AD100')).toBe(true);
  });

  it('reads uppercase file paths regardless of input case', async () => {
    await getPostalCodesOfState('ad', '03');
    const attempted = fsSpy.calls.filter((p) => p.endsWith('03.json'));
    expect(attempted.length).toBeGreaterThan(0);
    for (const p of attempted) {
      expect(p).toContain('AD');
      expect(p).not.toContain('/ad/');
    }
  });
});

describe('null locality_name records', () => {
  it('searchPostalCodesByLocality skips null locality_name instead of throwing', async () => {
    // PE/ANC.json ships records with locality_name: null
    await expect(searchPostalCodesByLocality('PE', 'ANC', 'a')).resolves.toBeInstanceOf(Array);
  });

  it('searchPostalCodesByLocalityInCountry skips null locality_name instead of throwing', async () => {
    await expect(searchPostalCodesByLocalityInCountry('BD', 'dhaka')).resolves.toBeInstanceOf(Array);
  });
});

describe('error propagation', () => {
  it('rejects on corrupted data files instead of returning []', async () => {
    fsSpy.impl = (p) => (p.includes('AI') ? '{ this is not valid JSON' : null);
    await expect(getUnassignedPostalCodesOfCountry('AI')).rejects.toThrow();
  });

  it('still returns [] for genuinely missing state files', async () => {
    expect(await getPostalCodesOfState('AD', 'ZZ')).toEqual([]);
  });
});

describe('caching', () => {
  it('does not re-read the manifest from disk on every call', async () => {
    await getManifest();
    const after1 = fsSpy.calls.filter((p) => p.includes('manifest.json')).length;
    await getManifest();
    const after2 = fsSpy.calls.filter((p) => p.includes('manifest.json')).length;
    expect(after1).toBeGreaterThan(0);
    expect(after2).toBe(after1);
  });

  it('does not re-read a state file from disk on repeat calls', async () => {
    await getPostalCodesOfState('AD', '02');
    const after1 = fsSpy.calls.filter((p) => p.endsWith('02.json')).length;
    await getPostalCodesOfState('AD', '02');
    const after2 = fsSpy.calls.filter((p) => p.endsWith('02.json')).length;
    expect(after1).toBeGreaterThan(0);
    expect(after2).toBe(after1);
  });

  it('caller mutation of a returned array does not poison later results', async () => {
    const first = await getPostalCodesOfState('AD', '02');
    const originalLength = first.length;
    expect(originalLength).toBeGreaterThan(0);
    first.pop();
    const second = await getPostalCodesOfState('AD', '02');
    expect(second.length).toBe(originalLength);
  });

  it('caller mutation of returned records does not poison later results', async () => {
    const first = await getPostalCodesOfState('AD', '02');
    const originalCode = first[0].code;
    first[0].code = 'CACHE-POISON';
    const second = await getPostalCodesOfState('AD', '02');
    expect(second[0].code).toBe(originalCode);
  });

  it('caller mutation of manifest entries does not poison the cache', async () => {
    const first = await getManifest();
    const originalStateCodes = [...first[0].state_codes];
    first[0].state_codes.length = 0;
    const second = await getManifest();
    expect(second[0].state_codes).toEqual(originalStateCodes);
  });
});
