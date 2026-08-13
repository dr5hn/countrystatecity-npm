#!/usr/bin/env node
/**
 * Orchestrates data generation across all packages.
 *
 * Order of execution:
 *   0. Join the full city file into source.json (by city id), then validate
 *      the joined dataset. A validation failure stops here — nothing below
 *      runs, and the currently-live packages/*\/src/data is untouched.
 *   Batch 1 (parallel): countries, timezones, currencies, translations, phonecodes — all read from the joined+validated source
 *   Batch 2 (parallel): countries-browser, geojson — both read from countries/src/data/ output
 *   Batch 3 (independent): postalcodes — own source file, optional
 *   Finally: write data-manifest.json (release info, checksums, counts, delta vs. the previous run).
 *
 *   data/version.json is written right after validation (before Batch 1) —
 *   not with the manifest — so per-package generators can copy it into their
 *   own staged output and have it commit atomically with the rest of their data.
 */

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const { joinCityFields } = require('./lib/join-city-fields.cjs');
const { validateData } = require('./lib/validate-data.cjs');
const { readManifest, writeManifest, sha256File } = require('./lib/manifest.cjs');
const { buildManifest } = require('./lib/build-manifest.cjs');
const { buildDataVersion } = require('./lib/build-data-version.cjs');

const ROOT = path.join(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'data', 'source.json');
const CITIES_FULL_FILE = path.join(ROOT, 'data', 'cities-full.json');
const TRANSLATIONS_FILE = path.join(ROOT, 'data', 'translations.csv');
const RELEASE_FILE = path.join(ROOT, 'data', 'release.json');
const ENRICHED_FILE = path.join(ROOT, 'data', 'source.enriched.json');
const VERSION_FILE = path.join(ROOT, 'data', 'version.json');
const POSTCODES_SOURCE_FILE = path.join(ROOT, 'data', 'postcodes-source.json');
const MANIFEST_FILE = path.join(ROOT, 'data-manifest.json');

const MAX_PRINTED_ERRORS = 50;

/** Verify that the pinned release record still matches every raw input file. */
function verifyReleaseFiles(release, pathsByRole) {
  const errors = [];
  for (const [role, filePath] of Object.entries(pathsByRole)) {
    const metadata = release.files?.find((file) => file.role === role);
    if (!metadata?.contentSha256) {
      errors.push(`release metadata is missing a checksum for ${role}`);
    } else if (!fs.existsSync(filePath)) {
      errors.push(`raw ${role} file is missing: ${filePath}`);
    } else if (sha256File(filePath) !== metadata.contentSha256) {
      errors.push(`raw ${role} file does not match release ${release.tag}`);
    }
  }
  return errors;
}

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

/** Counts CSV data rows (excludes the header row and any trailing blank line). */
function countCsvDataRows(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.length > 0);
  return Math.max(lines.length - 1, 0);
}

async function main() {
  if (
    !fs.existsSync(SOURCE_FILE) ||
    !fs.existsSync(CITIES_FULL_FILE) ||
    !fs.existsSync(TRANSLATIONS_FILE) ||
    !fs.existsSync(RELEASE_FILE)
  ) {
    console.error(
      '❌ Required source files not found (data/source.json, data/cities-full.json, data/translations.csv, data/release.json).',
    );
    console.error('   Run: pnpm fetch-database\n');
    process.exit(1);
  }

  const release = JSON.parse(fs.readFileSync(RELEASE_FILE, 'utf-8'));
  const releaseErrors = verifyReleaseFiles(release, {
    combined: SOURCE_FILE,
    'cities-full': CITIES_FULL_FILE,
    translations: TRANSLATIONS_FILE,
  });
  if (releaseErrors.length > 0) {
    console.error('❌ Raw source files do not match data/release.json:');
    for (const error of releaseErrors) console.error(`   - ${error}`);
    console.error('   Run pnpm fetch-database again before generating package data.');
    process.exit(1);
  }

  // ── Step 0: join + validate ─────────────────────────────────────────────
  console.log('🧬 Joining full city fields into the source dataset...');
  const countries = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
  const fullCityRecords = JSON.parse(fs.readFileSync(CITIES_FULL_FILE, 'utf-8'));
  const joinStats = joinCityFields(countries, fullCityRecords);
  console.log(
    `✓ Matched ${joinStats.matched}/${joinStats.totalCities} cities to the full city file (${joinStats.unmatched} unmatched)\n`,
  );

  console.log('🔍 Validating the joined dataset...');
  const previousManifest = readManifest(MANIFEST_FILE);
  const validation = validateData(countries, { previousManifest });
  for (const warning of validation.warnings) console.warn(`⚠️  ${warning}`);

  if (!validation.ok) {
    console.error(`\n❌ Validation failed with ${validation.errors.length} error(s):`);
    for (const error of validation.errors.slice(0, MAX_PRINTED_ERRORS)) console.error(`   - ${error}`);
    if (validation.errors.length > MAX_PRINTED_ERRORS) {
      console.error(`   ...and ${validation.errors.length - MAX_PRINTED_ERRORS} more`);
    }
    console.error('\n   No package data was regenerated — the currently-live data is untouched.');
    console.error('   A large or suspicious change needs human review before it can proceed.');
    process.exit(1);
  }
  console.log(
    `✓ Validation passed (${validation.counts.countries} countries, ${validation.counts.states} states, ${validation.counts.cities} cities)\n`,
  );

  // ── Compute the data version (release.json + validation.counts are both
  // in hand here, before any per-package generator spawns, and BEFORE
  // data-manifest.json exists — that's written last, once generation
  // succeeds) ──────────────────────────────────────────────────────────────
  console.log('🏷️  Computing data version...');
  const release = JSON.parse(fs.readFileSync(RELEASE_FILE, 'utf-8'));
  const dataVersion = buildDataVersion({ release, counts: validation.counts });
  const tmpVersionFile = `${VERSION_FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tmpVersionFile, JSON.stringify(dataVersion, null, 2) + '\n');
  fs.renameSync(tmpVersionFile, VERSION_FILE);
  console.log(`✓ data/version.json written (${dataVersion.dataVersion})\n`);

  const tmpEnriched = `${ENRICHED_FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tmpEnriched, JSON.stringify(countries));
  fs.renameSync(tmpEnriched, ENRICHED_FILE);

  console.log('🚀 Generating data for all packages...');
  console.log(`   Source: ${ENRICHED_FILE}\n`);

  // ── Batch 1: all packages that read directly from the joined source ────────
  console.log('── Batch 1 (parallel): countries, timezones, currencies, translations, phonecodes ──');

  await runParallel(
    ['countries', 'timezones', 'currencies', 'translations', 'phonecodes'].map((pkg) => ({
      label: pkg,
      args: ['scripts/generate-data.cjs', ENRICHED_FILE],
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

  // ── Manifest: release info, checksums, counts, delta vs. the previous run ──
  // (`release` was already parsed above, right after validation passed.)
  console.log('\n📄 Writing data-manifest.json...');
  const recordCountByRole = {
    combined: countries.length,
    'cities-full': fullCityRecords.length,
    translations: fs.existsSync(TRANSLATIONS_FILE) ? countCsvDataRows(TRANSLATIONS_FILE) : undefined,
  };
  const files = release.files.map((file) => ({ ...file, recordCount: recordCountByRole[file.role] }));

  const manifest = buildManifest({
    release: {
      repository: release.repository,
      tag: release.tag,
      htmlUrl: release.htmlUrl,
      publishedAt: release.publishedAt,
      fetchedAt: release.fetchedAt,
    },
    files,
    counts: validation.counts,
    cityFieldCoverage: { matchedFromFullCityFile: joinStats.matched, unmatched: joinStats.unmatched },
    previousManifest,
  });
  writeManifest(MANIFEST_FILE, manifest);
  console.log(`✓ data-manifest.json written (release ${release.tag})`);

  console.log('\n✅ All packages updated successfully.');
  console.log('   Run: pnpm build  to rebuild with new data.\n');
}

// Exported for tests; the orchestration only runs when executed directly.
module.exports = { runParallel, countCsvDataRows, verifyReleaseFiles };

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
}
