#!/usr/bin/env node
/**
 * Reads data-manifest.json and prints a markdown summary — to stdout, to
 * $GITHUB_STEP_SUMMARY (if set), and as a `summary` $GITHUB_OUTPUT variable
 * (if set). The multiline $GITHUB_OUTPUT form is written with a randomly
 * generated delimiter so nothing in the manifest content can ever break the
 * heredoc format.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { renderManifestSummary } = require('./lib/render-manifest-summary.cjs');

const MANIFEST_FILE = path.join(__dirname, '..', 'data-manifest.json');

function main() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error('❌ data-manifest.json not found — run pnpm generate-data first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  const summary = renderManifestSummary(manifest);

  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }

  if (process.env.GITHUB_OUTPUT) {
    const delimiter = `MANIFEST_SUMMARY_${crypto.randomUUID()}`;
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary<<${delimiter}\n${summary}\n${delimiter}\n`);
  }
}

main();
