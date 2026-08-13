const assert = require('node:assert/strict');
const test = require('node:test');

const { buildDataVersion, formatReleaseDate } = require('./build-data-version.cjs');

test('buildDataVersion assembles the full shape from a release+counts fixture', () => {
  const version = buildDataVersion({
    release: { tag: 'v3.2-export.7', publishedAt: '2026-07-29T09:01:18Z' },
    counts: { countries: 250, states: 5308, cities: 152970 },
  });

  assert.deepEqual(version, {
    dataVersion: 'v3.2-export.7-2026.07.29',
    sourceRelease: 'v3.2-export.7',
    updatedAt: '2026-07-29T09:01:18Z',
    recordCounts: { countries: 250, states: 5308, cities: 152970 },
  });
});

test('formatReleaseDate formats a UTC timestamp as YYYY.MM.DD', () => {
  assert.equal(formatReleaseDate('2026-07-29T09:01:18Z'), '2026.07.29');
});

test('formatReleaseDate uses UTC, not local time, near a UTC midnight boundary', () => {
  // Late in the UTC day — a local-getter implementation in a positive-offset
  // timezone would roll this over to the next day. Must stay 07-29.
  assert.equal(formatReleaseDate('2026-07-29T23:50:00Z'), '2026.07.29');
  // Early in the UTC day — a local-getter implementation in a negative-offset
  // timezone would roll this back to the previous day. Must stay 07-30.
  assert.equal(formatReleaseDate('2026-07-30T00:05:00Z'), '2026.07.30');
});

test('formatReleaseDate zero-pads single-digit month and day', () => {
  assert.equal(formatReleaseDate('2026-01-05T00:00:00Z'), '2026.01.05');
});
