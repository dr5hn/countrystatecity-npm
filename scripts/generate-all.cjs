#!/usr/bin/env node
/**
 * Orchestrates data generation across all packages.
 *
 * Order of execution:
 *   Batch 1 (parallel): countries, timezones, currencies, translations, phonecodes — all read from source.json
 *   Batch 2 (parallel): countries-browser, geojson — both read from countries/src/data/ output
 *   Batch 3 (independent): postalcodes — own source file, optional
 */

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'data', 'source.json');
const POSTCODES_SOURCE_FILE = path.join(ROOT, 'data', 'postcodes-source.json');

/** Run a node script synchronously (no shell), exiting the process on failure. */

function run(label, args, cwd) {
  console.log(`\n▶ ${label}`);
  try {
    execFileSync('node', args, { cwd, stdio: 'inherit' });
    console.log(`✓ ${label} done`);
  } catch {
    console.error(`❌ ${label} failed`);
    process.exit(1);
  }
}

/**
 * Run several generator commands concurrently, ALWAYS waiting for every
 * child to exit before settling. Rejecting on the first failure would
 * orphan the surviving children, which keep writing into packages/*\/src/data
 * after the orchestrator has already reported failure — a re-run then races
 * the orphan and can commit truncated or mixed-version data files.
 */
function runParallel(tasks) {
  return Promise.all(
    tasks.map(({ label, args, cwd }) => {
      console.log(`  ▶ ${label}`);
      return new Promise((resolve) => {
        const proc = spawn('node', args, { cwd, stdio: 'inherit' });
        proc.on('close', (code) => {
          if (code !== 0) {
            console.error(`  ❌ ${label} failed with exit code ${code}`);
            resolve({ label, ok: false });
          } else {
            console.log(`  ✓ ${label} done`);
            resolve({ label, ok: true });
          }
        });
        proc.on('error', (err) => {
          console.error(`  ❌ ${label} failed to spawn: ${err.message}`);
          resolve({ label, ok: false });
        });
      });
    }),
  ).then((results) => {
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      throw new Error(`${failed.map((f) => f.label).join(', ')} failed`);
    }
  });
}

async function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error('❌ data/source.json not found.');
    console.error('   Run: pnpm fetch-database\n');
    process.exit(1);
  }

  console.log('🚀 Generating data for all packages...');
  console.log(`   Source: ${SOURCE_FILE}\n`);

  // ── Batch 1: all packages that read directly from source.json ──────────────
  console.log('── Batch 1 (parallel): countries, timezones, currencies, translations, phonecodes ──');

  await runParallel(
    ['countries', 'timezones', 'currencies', 'translations', 'phonecodes'].map((pkg) => ({
      label: pkg,
      args: ['scripts/generate-data.cjs', SOURCE_FILE],
      cwd: path.join(ROOT, 'packages', pkg),
    })),
  );

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
      args: ['scripts/generate-data.cjs', countriesDataDir],
      cwd: path.join(ROOT, 'packages/countries-browser'),
    },
    {
      label: 'geojson',
      args: ['scripts/generate-data.cjs', countriesDataDir],
      cwd: path.join(ROOT, 'packages/geojson'),
    },
  ]);

  // ── Batch 3 (independent): postalcodes — own source file, optional ─────────
  console.log('\n── Batch 3 (independent): postalcodes ──');

  if (fs.existsSync(POSTCODES_SOURCE_FILE)) {
    run(
      'postalcodes',
      ['scripts/generate-data.cjs', POSTCODES_SOURCE_FILE],
      path.join(ROOT, 'packages/postalcodes'),
    );
  } else {
    console.log('⚠ data/postcodes-source.json not found — skipping postalcodes.');
    console.log('  Run: pnpm fetch-postcodes  (large: ~9MB gz / ~324MB decompressed)');
  }

  console.log('\n✅ All packages updated successfully.');
  console.log('   Run: pnpm build  to rebuild with new data.\n');
}

// Exported for tests; the orchestration only runs when executed directly.
module.exports = { runParallel };

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
}
