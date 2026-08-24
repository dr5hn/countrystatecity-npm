/**
 * Assembles the data-manifest.json object from already-computed pieces —
 * pure/no I/O, so it's easy to test and keeps generate-all.cjs's own
 * orchestration logic thin.
 */

function computeDelta(previousManifest, counts) {
  if (!previousManifest?.counts) return undefined;

  const delta = {};
  for (const key of Object.keys(counts)) {
    const previous = previousManifest.counts[key];
    if (typeof previous !== 'number') continue;
    const current = counts[key];
    const pct = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    delta[key] = { previous, current, pct: Math.round(pct * 100) / 100 };
  }
  return delta;
}

/**
 * @param {object} input
 * @param {{repository: string, tag: string, htmlUrl: string, publishedAt: string, fetchedAt: string}} input.release
 * @param {Array<object>} input.files - per-downloaded-asset records (asset, role, checksums, sizes, recordCount)
 * @param {{countries: number, states: number, cities: number}} input.counts
 * @param {{matchedFromFullCityFile: number, unmatched: number}} input.cityFieldCoverage
 * @param {object} [input.previousManifest]
 * @returns {object} the data-manifest.json contents
 */
function buildManifest(input) {
  const { release, files, counts, cityFieldCoverage, previousManifest } = input;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      repository: release.repository,
      releaseTag: release.tag,
      releaseUrl: release.htmlUrl,
      publishedAt: release.publishedAt,
      fetchedAt: release.fetchedAt,
    },
    files,
    counts,
    cityFieldCoverage,
    delta: computeDelta(previousManifest, counts),
  };
}

module.exports = { buildManifest, computeDelta };
