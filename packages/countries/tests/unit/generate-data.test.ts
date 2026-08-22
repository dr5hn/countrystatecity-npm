/**
 * Regression coverage for task 01 (data ingestion + manifest): confirms the
 * new type/population/wikiDataId city fields land in generated cities.json
 * untouched, existing fields are undisturbed, and a source city missing
 * those fields (never joined against the full city file) falls back to null
 * rather than throwing.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { generateSplitData } = require('../../scripts/generate-data.cjs');

const cleanupDirs: string[] = [];
afterEach(() => {
  for (const dir of cleanupDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function writeFixture(countries: unknown[]): { sourceFile: string; outputDir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'countries-generate-data-test-'));
  cleanupDirs.push(dir);
  const sourceFile = join(dir, 'source.json');
  writeFileSync(sourceFile, JSON.stringify(countries));
  return { sourceFile, outputDir: dir };
}

const BASE_COUNTRY = {
  id: 1,
  name: 'Testland',
  iso2: 'TL',
  iso3: 'TLD',
  states: [
    {
      id: 10,
      name: 'Test State',
      iso2: 'TS',
      cities: [
        {
          id: 100,
          name: 'Enriched City',
          latitude: '1.0',
          longitude: '2.0',
          timezone: 'UTC',
          type: 'city',
          native: 'Enriched Native Name',
          population: 12345,
          wikiDataId: 'Q1',
        },
        {
          id: 101,
          name: 'Unenriched City',
          latitude: '3.0',
          longitude: '4.0',
          timezone: 'UTC',
          // No type/native/population/wikiDataId — as if the join found no match.
        },
      ],
    },
  ],
};

function readCities(outputDir: string): Array<Record<string, unknown>> {
  const path = join(outputDir, 'src', 'data', 'Testland-TL', 'Test_State-TS', 'cities.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('generateSplitData — city field mapping', () => {
  it('carries type/native/population/wikiDataId through for an enriched city', () => {
    const { sourceFile, outputDir } = writeFixture([BASE_COUNTRY]);
    generateSplitData(sourceFile, outputDir);

    const [enriched] = readCities(outputDir);
    expect(enriched).toMatchObject({
      id: 100,
      name: 'Enriched City',
      state_id: 10,
      state_code: 'TS',
      country_id: 1,
      country_code: 'TL',
      latitude: '1.0',
      longitude: '2.0',
      timezone: 'UTC',
      type: 'city',
      native: 'Enriched Native Name',
      population: 12345,
      wikiDataId: 'Q1',
    });
  });

  it('falls back to null (never fabricated) when the source city has no join data', () => {
    const { sourceFile, outputDir } = writeFixture([BASE_COUNTRY]);
    generateSplitData(sourceFile, outputDir);

    const [, unenriched] = readCities(outputDir);
    expect(unenriched.id).toBe(101);
    expect(unenriched.type).toBeNull();
    expect(unenriched.native).toBeNull();
    expect(unenriched.population).toBeNull();
    expect(unenriched.wikiDataId).toBeNull();
  });

  it('leaves existing fields (translations, timezone) exactly as before', () => {
    const { sourceFile, outputDir } = writeFixture([BASE_COUNTRY]);
    generateSplitData(sourceFile, outputDir);

    const [enriched] = readCities(outputDir);
    expect(enriched.translations).toEqual({});
    expect(enriched.timezone).toBe('UTC');
  });
});
