#!/usr/bin/env node
/**
 * Resolves the exact latest release of countries-states-cities-database
 * once, then downloads the 3 required assets from THAT pinned release —
 * eliminating the "latest changed mid-run" race the old per-asset
 * /releases/latest/download/... approach was exposed to.
 *
 * Writes: data/source.json, data/cities-full.json, data/translations.csv,
 * and data/release.json (the resolved release + per-file integrity info,
 * consumed by scripts/generate-all.cjs's join/validate/manifest steps and
 * reused by scripts/fetch-postcodes.cjs to stay pinned to the same tag).
 */

const fs = require('fs');
const path = require('path');

const { resolveLatestRelease, requireAsset } = require('./lib/resolve-release.cjs');
const { downloadGzipAsset } = require('./lib/download.cjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RELEASE_FILE = path.join(DATA_DIR, 'release.json');

const REQUIRED_ASSETS = [
  { asset: 'json-countries+states+cities.json.gz', role: 'combined', destPath: path.join(DATA_DIR, 'source.json') },
  { asset: 'json-cities.json.gz', role: 'cities-full', destPath: path.join(DATA_DIR, 'cities-full.json') },
  { asset: 'csv-translations.csv.gz', role: 'translations', destPath: path.join(DATA_DIR, 'translations.csv') },
];

async function main() {
  console.log('🔎 Resolving the exact latest release of countries-states-cities-database...');
  const release = await resolveLatestRelease({ token: process.env.GITHUB_TOKEN });
  console.log(`✓ Pinned to release ${release.tag} (published ${release.publishedAt})\n`);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const stagingDir = fs.mkdtempSync(path.join(DATA_DIR, '.fetch-'));

  try {
    const files = [];
    const downloads = [];
    for (const { asset, role, destPath } of REQUIRED_ASSETS) {
      const { url } = requireAsset(release, asset);
      const stagedPath = path.join(stagingDir, path.basename(destPath));
      console.log(`📥 Downloading ${asset} (${role})...`);
      const result = await downloadGzipAsset({ url, destPath: stagedPath });
      console.log(
        `✓ ${asset}: ${(result.compressedBytes / 1024 / 1024).toFixed(2)}MB → ` +
          `${(result.decompressedBytes / 1024 / 1024).toFixed(2)}MB, sha256 ${result.contentSha256.slice(0, 12)}...\n`,
      );
      files.push({ asset, role, url, ...result });
      downloads.push({ stagedPath, destPath });
    }

    const countries = JSON.parse(fs.readFileSync(downloads[0].stagedPath, 'utf-8'));
    const cities = JSON.parse(fs.readFileSync(downloads[1].stagedPath, 'utf-8'));
    if (!Array.isArray(countries) || !Array.isArray(cities)) {
      throw new Error('Downloaded country and city assets must both contain JSON arrays');
    }

    const releaseRecord = {
      repository: 'dr5hn/countries-states-cities-database',
      tag: release.tag,
      htmlUrl: release.htmlUrl,
      publishedAt: release.publishedAt,
      fetchedAt: new Date().toISOString(),
      files,
    };
    const stagedReleaseFile = path.join(stagingDir, 'release.json');
    fs.writeFileSync(stagedReleaseFile, JSON.stringify(releaseRecord, null, 2) + '\n');

    // Nothing in data/ is replaced until every required asset has downloaded,
    // decompressed, and passed its basic shape check.
    for (const { stagedPath, destPath } of downloads) fs.renameSync(stagedPath, destPath);
    fs.renameSync(stagedReleaseFile, RELEASE_FILE);

    console.log(`✅ All 3 files downloaded and verified from release ${release.tag} (${countries.length} countries in the combined file).`);
    console.log('   Run pnpm generate-data to distribute to all packages.');
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('❌ Failed to fetch database:', err.message);
  process.exit(1);
});
