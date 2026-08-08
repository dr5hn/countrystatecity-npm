#!/usr/bin/env node
/**
 * Orchestrates data generation across all packages.
 *
 * Order of execution:
 *   Batch 1 (parallel): countries, timezones, currencies, translations, phonecodes — all read from source.json
 *   Batch 2 (parallel): countries-browser, geojson — both read from countries/src/data/ output
 *   Batch 3 (independent): postalcodes — own source file, optional
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'data', 'source.json');
const POSTCODES_SOURCE_FILE = path.join(ROOT, 'data', 'postcodes-source.json');

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
  return Promise.all(
    tasks.map(({ label, cmd, cwd }) => {
      console.log(`  ▶ ${label}`);
      return new Promise((resolve, reject) => {
        const proc = spawn(cmd, { cwd, stdio: 'inherit', shell: true });
        proc.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`${label} failed with exit code ${code}`));
          } else {
            console.log(`  ✓ ${label} done`);
            resolve();
          }
        });
        proc.on('error', reject);
      });
    }),
  );
}

async function main() {
  console.log('🚀 Generating data for all packages...');
  console.log(`   Source: ${SOURCE_FILE}\n`);

  // ── Batch 1: all packages that read directly from source.json ──────────────
  console.log('── Batch 1 (parallel): countries, timezones, currencies, translations, phonecodes ──');

  await runParallel([
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
    {
      label: 'phonecodes',
      cmd: `node scripts/generate-data.cjs "${SOURCE_FILE}"`,
      cwd: path.join(ROOT, 'packages/phonecodes'),
    },
  ]);

  // ── Batch 2: countries-browser, geojson both depend on countries/src/data/ ──
  console.log('\n── Batch 2 (parallel): countries-browser, geojson ──');

  const countriesDataDir = path.join(ROOT, 'packages/countries/src/data');
  if (!fs.existsSync(countriesDataDir)) {
    console.error('❌ packages/countries/src/data not found — countries batch must have failed.');
    process.exit(1);
  }

  await runParallel([
    {
      label: 'countries-browser',
      cmd: `node scripts/generate-data.cjs "${countriesDataDir}"`,
      cwd: path.join(ROOT, 'packages/countries-browser'),
    },
    {
      label: 'geojson',
      cmd: `node scripts/generate-data.cjs "${countriesDataDir}"`,
      cwd: path.join(ROOT, 'packages/geojson'),
    },
  ]);

  // ── Batch 3 (independent): postalcodes — own source file, optional ─────────
  console.log('\n── Batch 3 (independent): postalcodes ──');

  if (fs.existsSync(POSTCODES_SOURCE_FILE)) {
    run(
      'postalcodes',
      `node scripts/generate-data.cjs "${POSTCODES_SOURCE_FILE}"`,
      path.join(ROOT, 'packages/postalcodes'),
    );
  } else {
    console.log('⚠ data/postcodes-source.json not found — skipping postalcodes.');
    console.log('  Run: pnpm fetch-postcodes  (large: ~9MB gz / ~324MB decompressed)');
  }

  console.log('\n✅ All packages updated successfully.');
  console.log('   Run: pnpm build  to rebuild with new data.\n');
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
