/**
 * Assembles the data/version.json (and per-package version.json) contents —
 * pure/no I/O, so it's easy to test and keeps generate-all.cjs's own
 * orchestration logic thin. Mirrors build-manifest.cjs's shape.
 *
 * Field-for-field the same shape as csc-app's `GET /v1/meta/data-version`
 * (minus `regions`/`subregions`, which these packages don't ship), and
 * `dataVersion` uses the same `<source-release>-<YYYY.MM.DD>` format.
 *
 * `dataVersion` is NOT expected to be byte-identical to the API's, though.
 * Both sides take the tag from the same upstream release, but the date each
 * appends comes from a different event:
 *   - here:    the day the release was published upstream.
 *   - csc-app: the day that release was imported into the API database
 *              (`date -u +%Y.%m.%d` at import time — see csc-app's
 *              docs/operations/GEO-DATA-IMPORT.md, Step 8).
 * An import lands after the release is published, so the two strings
 * routinely differ by a day or more while describing exactly the same data.
 * `sourceRelease` is identical on both sides — that is the parity key a
 * consumer should compare.
 */

/**
 * Parses an ISO 8601 timestamp, failing loudly instead of letting an
 * unusable date reach a published package's version.json (a bad value here
 * would otherwise surface as `NaN.NaN.NaN` in every consumer's dataVersion).
 *
 * @param {string} publishedAt
 * @returns {Date}
 * @throws {TypeError} when publishedAt is not a parseable timestamp
 */
function parsePublishedAt(publishedAt) {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      `buildDataVersion: release.publishedAt is not a valid ISO 8601 timestamp (got ${JSON.stringify(publishedAt)})`,
    );
  }
  return date;
}

/**
 * Formats an ISO 8601 UTC timestamp (always Z-suffixed, e.g. a GitHub
 * release's published_at) as YYYY.MM.DD. Uses the UTC getters — not the
 * local-timezone ones — so the result never shifts by a day depending on
 * the machine/CI runner's timezone near a UTC midnight boundary.
 *
 * @param {string} publishedAt
 * @returns {string}
 */
function formatReleaseDate(publishedAt) {
  const date = parsePublishedAt(publishedAt);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * @param {object} input
 * @param {{tag: string, publishedAt: string}} input.release
 * @param {{countries: number, states: number, cities: number}} input.counts
 * @returns {{dataVersion: string, sourceRelease: string, updatedAt: string, recordCounts: object}}
 * @throws {TypeError} when release.tag or release.publishedAt is unusable
 */
function buildDataVersion(input) {
  const { release, counts } = input;

  if (typeof release?.tag !== 'string' || release.tag === '') {
    throw new TypeError(
      `buildDataVersion: release.tag must be a non-empty string (got ${JSON.stringify(release?.tag)})`,
    );
  }

  return {
    dataVersion: `${release.tag}-${formatReleaseDate(release.publishedAt)}`,
    sourceRelease: release.tag,
    // Normalised to millisecond precision so this field serialises the same
    // way csc-app writes its own `updatedAt` (`...T%H:%M:%S.000Z`). GitHub's
    // published_at omits the milliseconds, which would otherwise make the two
    // sides' timestamps differ in shape for the same instant.
    updatedAt: parsePublishedAt(release.publishedAt).toISOString(),
    recordCounts: counts,
  };
}

module.exports = { buildDataVersion, formatReleaseDate };
