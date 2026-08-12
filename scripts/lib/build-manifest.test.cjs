const assert = require('node:assert/strict');
const test = require('node:test');

const { buildManifest, computeDelta } = require('./build-manifest.cjs');

const RELEASE = {
  repository: 'dr5hn/countries-states-cities-database',
  tag: 'v3.2-export.7',
  htmlUrl: 'https://github.com/dr5hn/countries-states-cities-database/releases/tag/v3.2-export.7',
  publishedAt: '2026-07-29T09:01:18Z',
  fetchedAt: '2026-08-12T00:00:00.000Z',
};

test('assembles the full manifest shape, passing through files/counts/coverage untouched', () => {
  const files = [{ asset: 'json-cities.json.gz', role: 'cities-full', contentSha256: 'abc', recordCount: 1000 }];
  const counts = { countries: 250, states: 5100, cities: 151000 };
  const cityFieldCoverage = { matchedFromFullCityFile: 150800, unmatched: 200 };

  const manifest = buildManifest({ release: RELEASE, files, counts, cityFieldCoverage });

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(typeof manifest.generatedAt, 'string');
  assert.deepEqual(manifest.source, {
    repository: RELEASE.repository,
    releaseTag: RELEASE.tag,
    releaseUrl: RELEASE.htmlUrl,
    publishedAt: RELEASE.publishedAt,
    fetchedAt: RELEASE.fetchedAt,
  });
  assert.deepEqual(manifest.files, files);
  assert.deepEqual(manifest.counts, counts);
  assert.deepEqual(manifest.cityFieldCoverage, cityFieldCoverage);
});

test('omits delta entirely when there is no previous manifest (bootstrap case)', () => {
  const manifest = buildManifest({ release: RELEASE, files: [], counts: { countries: 1, states: 1, cities: 1 } });
  assert.equal(manifest.delta, undefined);
});

test('computeDelta computes previous/current/pct per entity, rounded to 2 decimals', () => {
  const delta = computeDelta({ counts: { countries: 250, states: 5000, cities: 150000 } }, { countries: 250, states: 5010, cities: 151500 });

  assert.deepEqual(delta.countries, { previous: 250, current: 250, pct: 0 });
  assert.deepEqual(delta.states, { previous: 5000, current: 5010, pct: 0.2 });
  assert.deepEqual(delta.cities, { previous: 150000, current: 151500, pct: 1 });
});

test('computeDelta returns undefined when previousManifest has no counts', () => {
  assert.equal(computeDelta(null, { countries: 1 }), undefined);
  assert.equal(computeDelta({}, { countries: 1 }), undefined);
});

test('computeDelta skips a key that is missing from the previous manifest rather than throwing', () => {
  const delta = computeDelta({ counts: { countries: 250 } }, { countries: 250, states: 100 });
  assert.deepEqual(Object.keys(delta), ['countries']);
});
