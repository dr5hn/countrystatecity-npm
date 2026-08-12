/**
 * Downloads and integrity-checks one gzip-compressed release asset.
 * Writes to a temp path in the same directory then renames into place, so a
 * failed re-fetch can never corrupt a previously-good file already on disk.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const DEFAULT_TIMEOUT_MS = 120_000;

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * @param {object} options
 * @param {string} options.url
 * @param {string} options.destPath - final destination for the DECOMPRESSED content
 * @param {typeof fetch} [options.fetchImpl]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{compressedSha256: string, contentSha256: string, compressedBytes: number, decompressedBytes: number}>}
 */
async function downloadGzipAsset(options) {
  const { url, destPath, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetchImpl(url, {
      headers: { 'User-Agent': 'countrystatecity-monorepo' },
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Download timed out after ${timeoutMs / 1000}s: ${url}`);
    }
    throw new Error(`Failed to download ${url}: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} downloading ${url}`);
  }

  const compressed = Buffer.from(await response.arrayBuffer());
  if (compressed.length === 0) {
    throw new Error(`Downloaded empty file from ${url}`);
  }

  let decompressed;
  try {
    decompressed = zlib.gunzipSync(compressed);
  } catch (err) {
    throw new Error(`Failed to decompress ${url}: ${err.message}`);
  }
  if (decompressed.length === 0) {
    throw new Error(`Decompressed to an empty file: ${url}`);
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const tmpPath = `${destPath}.tmp-${process.pid}`;
  fs.writeFileSync(tmpPath, decompressed);
  fs.renameSync(tmpPath, destPath);

  return {
    compressedSha256: sha256(compressed),
    contentSha256: sha256(decompressed),
    compressedBytes: compressed.length,
    decompressedBytes: decompressed.length,
  };
}

module.exports = { downloadGzipAsset, sha256 };
