#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUDGET_BYTES = 20 * 1024;
const BUNDLE_PATH = path.join(__dirname, '..', 'dist', 'index.js');

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(2)}KB`;
}

function checkSize(gzipBytes, budgetBytes) {
  return {
    ok: gzipBytes <= budgetBytes,
    gzipBytes,
    budgetBytes,
    message: `ESM bundle gzip size: ${formatKB(gzipBytes)} (budget: ${formatKB(budgetBytes)})`,
  };
}

function main() {
  if (!fs.existsSync(BUNDLE_PATH)) {
    console.error(`✗ ${BUNDLE_PATH} not found — run \`pnpm build\` first`);
    process.exit(1);
  }

  const raw = fs.readFileSync(BUNDLE_PATH);
  const gzipBytes = zlib.gzipSync(raw).length;
  const result = checkSize(gzipBytes, BUDGET_BYTES);

  if (result.ok) {
    console.log(`✓ ${result.message}`);
  } else {
    console.error(`✗ ${result.message} — over budget`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkSize, formatKB, BUDGET_BYTES };
