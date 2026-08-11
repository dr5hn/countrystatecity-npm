#!/usr/bin/env node
/**
 * Downloads the latest countries-states-cities-database release
 * and saves it to data/source.json at the monorepo root.
 *
 * All packages consume this single file — fetch once, distribute everywhere.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SOURCE_URL =
  'https://github.com/dr5hn/countries-states-cities-database/releases/latest/download/json-countries%2Bstates%2Bcities.json.gz';

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'source.json');

// Abort if the socket goes idle this long — a stalled CDN connection must
// fail loudly instead of hanging the script (and CI) forever.
const SOCKET_IDLE_TIMEOUT_MS = 120_000;

/** Download a URL (following redirects), rejecting on error or socket stall. */
function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 10) return reject(new Error('Too many redirects'));

    const req = https
      .get(url, { headers: { 'User-Agent': 'countrystatecity-monorepo' }, timeout: SOCKET_IDLE_TIMEOUT_MS }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`  ↳ Redirecting (${res.statusCode})...`);
          res.resume();
          return resolve(download(res.headers.location, redirects + 1));
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);

    req.on('timeout', () => {
      req.destroy(new Error(`Download stalled: no data for ${SOCKET_IDLE_TIMEOUT_MS / 1000}s from ${url}`));
    });
  });
}

async function main() {
  console.log('📥 Fetching latest countries-states-cities database...');
  console.log(`   Source: ${SOURCE_URL}\n`);

  const compressed = await download(SOURCE_URL);
  console.log(`✓ Downloaded ${(compressed.length / 1024 / 1024).toFixed(2)} MB (compressed)`);

  const decompressed = zlib.gunzipSync(compressed);
  console.log(`✓ Decompressed to ${(decompressed.length / 1024 / 1024).toFixed(2)} MB`);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, decompressed);

  const countries = JSON.parse(decompressed.toString());
  console.log(`✓ Saved to data/source.json (${countries.length} countries)\n`);
  console.log('Run pnpm generate-data to distribute to all packages.');
}

main().catch((err) => {
  console.error('❌ Failed to fetch database:', err.message);
  process.exit(1);
});
