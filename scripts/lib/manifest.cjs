/**
 * Read/write/hash helpers for the root data-manifest.json. Assembling the
 * manifest's contents (counts, deltas) happens in build-manifest.cjs — this
 * module is pure I/O.
 */

const fs = require('fs');
const crypto = require('crypto');

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function writeManifest(manifestPath, manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

module.exports = { sha256File, readManifest, writeManifest };
