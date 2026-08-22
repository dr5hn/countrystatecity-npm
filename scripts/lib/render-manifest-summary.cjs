/**
 * Renders data-manifest.json into a compact markdown summary — reused for
 * both the GitHub Actions step summary and the automated-data-update PR
 * body, so "what changed" grows automatically as manifest fields are added
 * instead of needing a YAML table edited by hand each time.
 */

function renderManifestSummary(manifest) {
  const lines = [];

  lines.push(`**Release:** [\`${manifest.source.releaseTag}\`](${manifest.source.releaseUrl}) (published ${manifest.source.publishedAt})`);
  lines.push('');
  lines.push('| Entity | Count |');
  lines.push('|---|---:|');
  lines.push(`| Countries | ${manifest.counts.countries} |`);
  lines.push(`| States | ${manifest.counts.states} |`);
  lines.push(`| Cities | ${manifest.counts.cities} |`);
  lines.push('');

  if (manifest.delta) {
    lines.push('| Entity | Previous | Current | Change |');
    lines.push('|---|---:|---:|---:|');
    for (const key of ['countries', 'states', 'cities']) {
      const d = manifest.delta[key];
      if (!d) continue;
      const sign = d.pct > 0 ? '+' : '';
      lines.push(`| ${key.charAt(0).toUpperCase()}${key.slice(1)} | ${d.previous} | ${d.current} | ${sign}${d.pct}% |`);
    }
    lines.push('');
  }

  lines.push(
    `City field coverage: ${manifest.cityFieldCoverage.matchedFromFullCityFile}/${manifest.counts.cities} matched ` +
      `to the full city file (${manifest.cityFieldCoverage.unmatched} unmatched).`,
  );
  lines.push('');

  lines.push('<details><summary>Source file checksums</summary>');
  lines.push('');
  lines.push('| Asset | Records | SHA-256 (content) |');
  lines.push('|---|---:|---|');
  for (const file of manifest.files) {
    lines.push(`| ${file.asset} | ${file.recordCount ?? '—'} | \`${file.contentSha256.slice(0, 16)}…\` |`);
  }
  lines.push('');
  lines.push('</details>');

  return lines.join('\n');
}

module.exports = { renderManifestSummary };
