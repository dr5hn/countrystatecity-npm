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
    updatedAt: '2026-07-29T09:01:18.000Z',
    recordCounts: { countries: 250, states: 5308, cities: 152970 },
  });
});

test('buildDataVersion normalises updatedAt to millisecond precision', () => {
  // GitHub's published_at has second precision; csc-app writes its own
  // updatedAt as `...T%H:%M:%S.000Z`. Both sides must serialise the same
  // instant the same way, so this field is always normalised here.
  const secondPrecision = buildDataVersion({
    release: { tag: 'v3.2-export.7', publishedAt: '2026-07-29T09:01:18Z' },
    counts: { countries: 1, states: 1, cities: 1 },
  });
  assert.equal(secondPrecision.updatedAt, '2026-07-29T09:01:18.000Z');

  // An already-millisecond input passes through unchanged rather than
  // gaining a second `.000`.
  const msPrecision = buildDataVersion({
    release: { tag: 'v3.2-export.7', publishedAt: '2026-07-29T09:01:18.412Z' },
    counts: { countries: 1, states: 1, cities: 1 },
  });
  assert.equal(msPrecision.updatedAt, '2026-07-29T09:01:18.412Z');
});

test('buildDataVersion keeps sourceRelease byte-identical to the release tag', () => {
  // sourceRelease is the field a consumer compares against the API's own
  // response — unlike dataVersion, whose date half is the publish date here
  // and the import date on the API side.
  const version = buildDataVersion({
    release: { tag: 'v3.2-export.7', publishedAt: '2026-07-29T09:01:18Z' },
    counts: { countries: 250, states: 5308, cities: 152970 },
  });

  assert.equal(version.sourceRelease, 'v3.2-export.7');
  assert.ok(version.dataVersion.startsWith(`${version.sourceRelease}-`));
});

test('buildDataVersion throws on an unparseable publishedAt instead of emitting NaN', () => {
  assert.throws(
    () =>
      buildDataVersion({
        release: { tag: 'v3.2-export.7', publishedAt: 'not-a-date' },
        counts: { countries: 1, states: 1, cities: 1 },
      }),
    /not a valid ISO 8601 timestamp/,
  );
});

test('buildDataVersion throws on a missing or empty release tag', () => {
  const counts = { countries: 1, states: 1, cities: 1 };
  const publishedAt = '2026-07-29T09:01:18Z';

  assert.throws(
    () => buildDataVersion({ release: { publishedAt }, counts }),
    /release\.tag must be a non-empty string/,
  );
  assert.throws(
    () => buildDataVersion({ release: { tag: '', publishedAt }, counts }),
    /release\.tag must be a non-empty string/,
  );
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

test('formatReleaseDate throws on an unparseable timestamp', () => {
  assert.throws(() => formatReleaseDate('nonsense'), /not a valid ISO 8601 timestamp/);
});
