#!/usr/bin/env node
/**
 * Data generation script for @countrystatecity/countries-browser
 * Reads the server package's nested data and flattens it for CDN access
 *
 * Usage:
 *   node scripts/generate-data.cjs <server-data-dir>
 *   node scripts/generate-data.cjs ../countrystatecity-countries/src/data
 */

const fs = require('fs');
const path = require('path');

const { beginStagedWrite } = require('../../../scripts/lib/staged-write.cjs');

function generateBrowserData(sourceDir, outputDir) {
  console.log(`📥 Reading server data from: ${sourceDir}`);

  // Staged then atomically swapped into place via commit() — a crash mid-run
  // never leaves the live output directory without a complete dataset.
  const finalDataDir = outputDir;
  const { stagingDir: dataDir, commit } = beginStagedWrite(finalDataDir);

  fs.mkdirSync(path.join(dataDir, 'country'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'states'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'cities'), { recursive: true });

  // 1. Copy countries.json as-is
  const countriesSource = path.join(sourceDir, 'countries.json');
  if (!fs.existsSync(countriesSource)) {
    console.error(`❌ Error: countries.json not found at ${countriesSource}`);
    process.exit(1);
  }
  fs.copyFileSync(countriesSource, path.join(dataDir, 'countries.json'));
  const countries = JSON.parse(fs.readFileSync(countriesSource, 'utf-8'));
  console.log(`✓ Copied countries.json (${countries.length} countries)`);

  // 1b. Copy regions.json / subregions.json as-is (small, static reference data)
  for (const file of ['regions.json', 'subregions.json']) {
    const src = path.join(sourceDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dataDir, file));
      console.log(`✓ Copied ${file}`);
    }
  }

  // 1c. Copy the data version, falling back to preserving the currently-live
  // one when the source directory has none. beginStagedWrite() stages into an
  // EMPTY directory, so skipping outright would silently delete a
  // previously-published version.json on a standalone run against a source
  // tree that predates it — the same guard packages/countries' generator
  // makes for its own copy of this file.
  const versionSource = path.join(sourceDir, 'version.json');
  const liveVersionFile = path.join(finalDataDir, 'version.json');
  if (fs.existsSync(versionSource)) {
    fs.copyFileSync(versionSource, path.join(dataDir, 'version.json'));
    console.log('✓ Copied version.json');
  } else if (fs.existsSync(liveVersionFile)) {
    fs.copyFileSync(liveVersionFile, path.join(dataDir, 'version.json'));
    console.warn('⚠ version.json not found in source — preserving the previously-published version');
  } else {
    console.warn('⚠ No version.json available (new package or first-ever generation) — skipping');
  }

  // 2. Process each country directory
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const countryDirs = entries.filter((e) => e.isDirectory());

  let totalStates = 0;
  let totalCityFiles = 0;

  for (const dir of countryDirs) {
    const parts = dir.name.split('-');
    const iso2 = parts[parts.length - 1];
    const countryPath = path.join(sourceDir, dir.name);

    // meta.json -> country/{ISO2}.json
    const metaPath = path.join(countryPath, 'meta.json');
    if (fs.existsSync(metaPath)) {
      fs.copyFileSync(metaPath, path.join(dataDir, 'country', `${iso2}.json`));
    }

    // states.json -> states/{ISO2}.json
    const statesPath = path.join(countryPath, 'states.json');
    if (fs.existsSync(statesPath)) {
      fs.copyFileSync(statesPath, path.join(dataDir, 'states', `${iso2}.json`));
      const states = JSON.parse(fs.readFileSync(statesPath, 'utf-8'));
      totalStates += states.length;
    }

    // {StateName-CODE}/cities.json -> cities/{ISO2}-{CODE}.json
    const stateEntries = fs.readdirSync(countryPath, { withFileTypes: true });
    const stateDirs = stateEntries.filter((e) => e.isDirectory());

    for (const stateDir of stateDirs) {
      const stateParts = stateDir.name.split('-');
      const stateCode = stateParts[stateParts.length - 1];
      const citiesPath = path.join(countryPath, stateDir.name, 'cities.json');

      if (fs.existsSync(citiesPath)) {
        fs.copyFileSync(
          citiesPath,
          path.join(dataDir, 'cities', `${iso2}-${stateCode}.json`),
        );
        totalCityFiles++;
      }
    }
  }

  commit();

  console.log('\n✅ Browser data generation complete!');
  console.log(`📊 Statistics:`);
  console.log(`   - Countries: ${countries.length}`);
  console.log(`   - Country directories processed: ${countryDirs.length}`);
  console.log(`   - Total states: ${totalStates}`);
  console.log(`   - City files created: ${totalCityFiles}`);
  console.log(`   - Output directory: ${finalDataDir}`);
}

const sourceDir = process.argv[2];
const outputDir = process.argv[3] || path.join(__dirname, '..', 'src', 'data');

if (!sourceDir) {
  console.error('❌ Error: Source data directory required');
  console.log('\nUsage: node scripts/generate-data.cjs <server-data-dir> [output-dir]');
  console.log('\nExample:');
  console.log('  node scripts/generate-data.cjs ../countrystatecity-countries/src/data');
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Error: Source directory not found: ${sourceDir}`);
  process.exit(1);
}

generateBrowserData(sourceDir, outputDir);
