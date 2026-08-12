#!/usr/bin/env node
/**
 * Downloads the postcodes release asset, pinned to the same release tag
 * scripts/fetch-database.cjs already resolved in this run (data/release.json),
 * so country/state/city and postcode data can never come from two different
 * upstream releases in one workflow run. Falls back to resolving its own
 * latest release when run standalone (data/release.json absent).
 */

const fs = require('fs');
const path = require('path');

const { resolveLatestRelease, resolveReleaseByTag, requireAsset } = require('./lib/resolve-release.cjs');
const { downloadGzipAsset } = require('./lib/download.cjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RELEASE_FILE = path.join(DATA_DIR, 'release.json');
const DEST_PATH = path.join(DATA_DIR, 'postcodes-source.json');
const ASSET_NAME = 'json-postcodes.json.gz';

async function resolveRelease() {
  if (fs.existsSync(RELEASE_FILE)) {
    const pinned = JSON.parse(fs.readFileSync(RELEASE_FILE, 'utf-8'));
    console.log(`🔗 Reusing release ${pinned.tag} pinned by fetch-database (data/release.json)...`);
    return resolveReleaseByTag({ tag: pinned.tag, token: process.env.GITHUB_TOKEN });
  }
  console.log('🔎 No data/release.json found — resolving the latest release independently...');
  return resolveLatestRelease({ token: process.env.GITHUB_TOKEN });
}

async function main() {
  const release = await resolveRelease();
  console.log(`✓ Pinned to release ${release.tag} (published ${release.publishedAt})\n`);

  const { url } = requireAsset(release, ASSET_NAME);
  console.log(`📥 Downloading ${ASSET_NAME}...`);
  const result = await downloadGzipAsset({ url, destPath: DEST_PATH });
  console.log(
    `✓ ${ASSET_NAME}: ${(result.compressedBytes / 1024 / 1024).toFixed(2)}MB → ` +
      `${(result.decompressedBytes / 1024 / 1024).toFixed(2)}MB, sha256 ${result.contentSha256.slice(0, 12)}...\n`,
  );

  console.log(`✅ Saved to data/postcodes-source.json (release ${release.tag}).`);
  console.log(
    '   Run: pnpm --filter @countrystatecity/postalcodes generate-data ../../data/postcodes-source.json',
  );
}

main().catch((err) => {
  console.error('❌ Failed to fetch postcodes:', err.message);
  process.exit(1);
});
