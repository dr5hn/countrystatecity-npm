import { describe, it, expect } from 'vitest';
import {
  getManifest,
  getPostalCodesOfState,
  getUnassignedPostalCodesOfCountry,
  getAllPostalCodesOfCountry,
} from '../../src/loaders';

describe('Data Loaders', () => {
  describe('getManifest', () => {
    it('should return an array of supported countries', async () => {
      const manifest = await getManifest();
      expect(Array.isArray(manifest)).toBe(true);
      // Not all 250 countries have postal codes; loosely bounded since upstream data drifts weekly.
      expect(manifest.length).toBeGreaterThan(50);
      expect(manifest.length).toBeLessThan(250);
    });

    it('should have required manifest entry properties', async () => {
      const manifest = await getManifest();
      const entry = manifest.find((e) => e.country_code === 'AD');
      expect(entry).toBeDefined();
      expect(entry?.count).toBeGreaterThan(0);
      expect(Array.isArray(entry?.state_codes)).toBe(true);
      expect(typeof entry?.has_unassigned).toBe('boolean');
    });

    it('should stay small enough for eager loading (sanity guard)', async () => {
      const manifest = await getManifest();
      expect(JSON.stringify(manifest).length).toBeLessThan(50_000);
    });
  });

  describe('getPostalCodesOfState', () => {
    it('should return postal codes for a valid country/state', async () => {
      const codes = await getPostalCodesOfState('AD', '02');
      expect(codes.length).toBeGreaterThan(0);
      expect(codes.every((c) => c.country_code === 'AD')).toBe(true);
    });

    it('should return empty array for an unsupported country', async () => {
      const codes = await getPostalCodesOfState('ZZ', 'XX');
      expect(codes).toEqual([]);
    });
  });

  describe('getUnassignedPostalCodesOfCountry', () => {
    it('should return postal codes with null state_code for a state-less country', async () => {
      // Bermuda has no state subdivisions in the postal code dataset.
      const codes = await getUnassignedPostalCodesOfCountry('BM');
      expect(codes.length).toBeGreaterThan(0);
      expect(codes.every((c) => c.state_code === null)).toBe(true);
    });

    it('should coexist with state-linked data for a mixed country', async () => {
      // Netherlands has both state-linked and unassigned postal codes.
      const manifest = await getManifest();
      const nl = manifest.find((e) => e.country_code === 'NL');
      expect(nl?.has_unassigned).toBe(true);
      expect(nl?.state_codes.length).toBeGreaterThan(0);

      const unassigned = await getUnassignedPostalCodesOfCountry('NL');
      const stateLinked = await getPostalCodesOfState('NL', nl!.state_codes[0]);
      expect(unassigned.length).toBeGreaterThan(0);
      expect(stateLinked.length).toBeGreaterThan(0);
    });
  });

  describe('getAllPostalCodesOfCountry', () => {
    it('should aggregate state files and the unassigned bucket', async () => {
      const manifest = await getManifest();
      const entry = manifest.find((e) => e.country_code === 'AD');
      const all = await getAllPostalCodesOfCountry('AD');
      expect(all.length).toBe(entry?.count);
      expect(all.every((c) => c.country_code === 'AD')).toBe(true);
    });

    it('should return empty array for an unsupported country', async () => {
      const all = await getAllPostalCodesOfCountry('ZZ');
      expect(all).toEqual([]);
    });
  });
});
