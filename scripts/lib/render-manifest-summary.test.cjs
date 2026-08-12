const assert = require('node:assert/strict');
const test = require('node:test');

const { renderManifestSummary } = require('./render-manifest-summary.cjs');

const BASE_MANIFEST = {
  source: {
    releaseTag: 'v3.2-export.7',
    releaseUrl: 'https://github.com/dr5hn/countries-states-cities-database/releases/tag/v3.2-export.7',
    publishedAt: '2026-07-29T09:01:18Z',
  },
  counts: { countries: 250, states: 5308, cities: 152970 },
  cityFieldCoverage: { matchedFromFullCityFile: 152970, unmatched: 0 },
  files: [
    { asset: 'json-cities.json.gz', recordCount: 152970, contentSha256: 'abcdef0123456789abcdef0123456789' },
  ],
};

test('includes the release tag as a link and the published date', () => {
  const summary = renderManifestSummary(BASE_MANIFEST);
  assert.ok(summary.includes('v3.2-export.7'));
  assert.ok(summary.includes(BASE_MANIFEST.source.releaseUrl));
  assert.ok(summary.includes('2026-07-29T09:01:18Z'));
});

test('includes a counts table for countries/states/cities', () => {
  const summary = renderManifestSummary(BASE_MANIFEST);
  assert.ok(summary.includes('| Countries | 250 |'));
  assert.ok(summary.includes('| States | 5308 |'));
  assert.ok(summary.includes('| Cities | 152970 |'));
});

test('includes the city field coverage line', () => {
  const summary = renderManifestSummary(BASE_MANIFEST);
  assert.ok(summary.includes('152970/152970 matched'));
  assert.ok(summary.includes('0 unmatched'));
});

test('includes a checksums detail block listing every file', () => {
  const summary = renderManifestSummary(BASE_MANIFEST);
  assert.ok(summary.includes('<details>'));
  assert.ok(summary.includes('json-cities.json.gz'));
  assert.ok(summary.includes('abcdef0123456789'));
});

test('omits the delta table entirely when there is no delta (bootstrap run)', () => {
  const summary = renderManifestSummary(BASE_MANIFEST);
  assert.ok(!summary.includes('Previous'));
});

test('includes a delta table with signed percentages when delta is present', () => {
  const manifest = {
    ...BASE_MANIFEST,
    delta: {
      countries: { previous: 250, current: 250, pct: 0 },
      states: { previous: 5300, current: 5308, pct: 0.15 },
      cities: { previous: 150000, current: 152970, pct: 1.98 },
    },
  };
  const summary = renderManifestSummary(manifest);

  assert.ok(summary.includes('| Previous | Current | Change |'));
  assert.ok(summary.includes('| States | 5300 | 5308 | +0.15% |'));
  assert.ok(summary.includes('| Cities | 150000 | 152970 | +1.98% |'));
  assert.ok(summary.includes('| Countries | 250 | 250 | 0% |'));
});
