/**
 * Assembles the data/version.json (and per-package version.json) contents —
 * pure/no I/O, so it's easy to test and keeps generate-all.cjs's own
 * orchestration logic thin. Mirrors build-manifest.cjs's shape.
 *
 * `dataVersion`'s format (`<release-tag>-<YYYY.MM.DD>`) matches csc-app's
 * API-side data-version response/headers exactly, so a customer comparing
 * an npm package against a live API response sees the identical string.
 */

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
  const date = new Date(publishedAt);
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
 */
function buildDataVersion(input) {
  const { release, counts } = input;

  return {
    dataVersion: `${release.tag}-${formatReleaseDate(release.publishedAt)}`,
    sourceRelease: release.tag,
    updatedAt: release.publishedAt,
    recordCounts: counts,
  };
}

module.exports = { buildDataVersion, formatReleaseDate };
