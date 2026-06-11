#!/usr/bin/env node
/**
 * Orchestrates data generation across all packages.
 *
 * Order of execution:
 *   Batch 1 (parallel): countries, timezones, currencies, translations — all read from source.json
 *   Batch 2 (sequential): countries-browser — reads from countries/src/data/ output
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'data', 'source.json');

if (!fs.existsSync(SOURCE_FILE)) {
  console.error('❌ data/source.json not found.');
  console.error('   Run: pnpm fetch-database\n');
  process.exit(1);
}

function run(label, cmd, cwd) {
  console.log(`\n▶ ${label}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    console.log(`✓ ${label} done`);
  } catch {
    console.error(`❌ ${label} failed`);
    process.exit(1);
  }
}

function runParallel(tasks) {
  const { spawnSync } = require('child_process');
  const results = tasks.map(({ label, cmd, cwd }) => {
    console.log(`  ▶ ${label}`);
    return spawnSync(cmd, { cwd, stdio: 'pipe', shell: true });
  });

  let failed = false;
  results.forEach((result, i) => {
    const { label } = tasks[i];
    if (result.status !== 0) {
      console.error(`❌ ${label} failed`);
      if (result.stderr) console.error(result.stderr.toString());
      failed = true;
    } else {
      console.log(`  ✓ ${label} done`);
    }
  });

  if (failed) process.exit(1);
}

console.log('🚀 Generating data for all packages...');
console.log(`   Source: ${SOURCE_FILE}\n`);

// ── Batch 1: all packages that read directly from source.json ──────────────
console.log('── Batch 1 (parallel): countries, timezones, currencies, translations ──');

runParallel([
  {
    label: 'countries',
    cmd: `node scripts/generate-data.cjs "${SOURCE_FILE}"`,
    cwd: path.join(ROOT, 'packages/countries'),
  },
  {
    label: 'timezones',
    cmd: `node scripts/generate-data.cjs "${SOURCE_FILE}"`,
    cwd: path.join(ROOT, 'packages/timezones'),
  },
  {
    label: 'currencies',
    cmd: `node scripts/generate-data.cjs "${SOURCE_FILE}"`,
    cwd: path.join(ROOT, 'packages/currencies'),
  },
  {
    label: 'translations',
    cmd: `node scripts/generate-data.cjs "${SOURCE_FILE}"`,
    cwd: path.join(ROOT, 'packages/translations'),
  },
]);

// ── Batch 2: countries-browser depends on countries/src/data/ ──────────────
console.log('\n── Batch 2 (sequential): countries-browser ──');

const countriesDataDir = path.join(ROOT, 'packages/countries/src/data');
if (!fs.existsSync(countriesDataDir)) {
  console.error('❌ packages/countries/src/data not found — countries batch must have failed.');
  process.exit(1);
}

run(
  'countries-browser',
  `node scripts/generate-data.cjs "${countriesDataDir}"`,
  path.join(ROOT, 'packages/countries-browser'),
);

console.log('\n✅ All packages updated successfully.');
console.log('   Run: pnpm build  to rebuild with new data.\n');
