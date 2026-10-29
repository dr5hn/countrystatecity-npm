#!/usr/bin/env node
/**
 * Downloads the postcodes release asset, pinned to the same release tag
 * scripts/fetch-database.cjs already resolved in this run (data/release.json),
 * so country/state/city and postcode data can never come from two different
 * upstream releases in one workflow run. Standalone runs resolve the latest
 * release unless --use-pinned-release is passed explicitly.
 */

const fs = require('fs');
const path = require('path');

const { resolveLatestRelease, resolveReleaseByTag, requireAsset } = require('./lib/resolve-release.cjs');
const { downloadGzipAsset } = require('./lib/download.cjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RELEASE_FILE = path.join(DATA_DIR, 'release.json');
const DEST_PATH = path.join(DATA_DIR, 'postcodes-source.json');
const ASSET_NAME = 'json-postcodes.json.gz';

async function resolveRelease(usePinnedRelease = false) {
  if (usePinnedRelease) {
    if (!fs.existsSync(RELEASE_FILE)) {
      throw new Error('--use-pinned-release requires data/release.json from fetch-database');
    }
    const pinned = JSON.parse(fs.readFileSync(RELEASE_FILE, 'utf-8'));
    console.log(`🔗 Reusing release ${pinned.tag} pinned by fetch-database (data/release.json)...`);
    return resolveReleaseByTag({ tag: pinned.tag, token: process.env.GITHUB_TOKEN });
  }
  console.log('🔎 Resolving the latest release independently...');
  return resolveLatestRelease({ token: process.env.GITHUB_TOKEN });
}

async function main() {
  const usePinnedRelease = process.argv.includes('--use-pinned-release');
  const release = await resolveRelease(usePinnedRelease);
  console.log(`✓ Pinned to release ${release.tag} (published ${release.publishedAt})\n`);

  const { url } = requireAsset(release, ASSET_NAME);
  console.log(`📥 Downloading ${ASSET_NAME}...`);
  const result = await downloadGzipAsset({ url, destPath: DEST_PATH });
  if (usePinnedRelease) {
    const pinned = JSON.parse(fs.readFileSync(RELEASE_FILE, 'utf8'));
    if (pinned.tag !== release.tag) throw new Error('Pinned release changed during postcode fetch');
    pinned.files = pinned.files.filter(file => file.role !== 'postcodes');
    pinned.files.push({ asset: ASSET_NAME, role: 'postcodes', url, ...result,
      recordCount: JSON.parse(fs.readFileSync(DEST_PATH, 'utf8')).length });
    const temporary = `${RELEASE_FILE}.tmp-${process.pid}`;
    fs.writeFileSync(temporary, JSON.stringify(pinned, null, 2) + '\n');
    fs.renameSync(temporary, RELEASE_FILE);
  }
  console.log(
    `✓ ${ASSET_NAME}: ${(result.compressedBytes / 1024 / 1024).toFixed(2)}MB → ` +
      `${(result.decompressedBytes / 1024 / 1024).toFixed(2)}MB, sha256 ${result.contentSha256.slice(0, 12)}...\n`,
  );

  console.log(`✅ Saved to data/postcodes-source.json (release ${release.tag}).`);
  console.log(
    '   Run: pnpm --filter @countrystatecity/postalcodes generate-data ../../data/postcodes-source.json',
  );
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Failed to fetch postcodes:', err.message);
    process.exit(1);
  });
}

module.exports = { resolveRelease };
