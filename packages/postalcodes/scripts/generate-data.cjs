#!/usr/bin/env node
/**
 * Data generation script for @countrystatecity/postalcodes
 * Splits the flat upstream postcodes dump into per-country/per-state files,
 * since a single file per country would be tens of MB for the largest countries
 * (e.g. Portugal has 197K records).
 */

const fs = require('fs');
const path = require('path');

const { beginStagedWrite } = require('../../../scripts/lib/staged-write.cjs');

function generateSplitData(sourceFile, outputDir) {
  console.log('📥 Loading source data...');
  const records = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  console.log(`✓ Loaded ${records.length} records`);

  // Staged then atomically swapped into place via commit() — a crash mid-run
  // never leaves the live output directory without a complete dataset.
  const finalDataDir = path.join(outputDir, 'src', 'data');
  const { stagingDir: dataDir, commit } = beginStagedWrite(finalDataDir);

  // country_code -> (stateKey -> record[]), stateKey = state_code || '_unassigned'
  const byCountry = new Map();

  for (const r of records) {
    if (!r.country_code) continue;
    if (!byCountry.has(r.country_code)) byCountry.set(r.country_code, new Map());
    const byState = byCountry.get(r.country_code);
    const key = r.state_code || '_unassigned';
    if (!byState.has(key)) byState.set(key, []);
    byState.get(key).push({
      id: r.id,
      code: r.code,
      country_code: r.country_code,
      state_code: r.state_code,
      locality_name: r.locality_name,
      type: r.type,
      latitude: r.latitude,
      longitude: r.longitude,
    });
  }

  const manifest = [];
  let totalRecords = 0;

  for (const [countryCode, byState] of byCountry) {
    const countryDir = path.join(dataDir, countryCode);
    fs.mkdirSync(countryDir, { recursive: true });

    const stateCodes = [];
    let hasUnassigned = false;
    let countryCount = 0;

    for (const [key, recs] of byState) {
      const fileName = key === '_unassigned' ? '_unassigned.json' : `${key}.json`;
      fs.writeFileSync(path.join(countryDir, fileName), JSON.stringify(recs));
      if (key === '_unassigned') hasUnassigned = true;
      else stateCodes.push(key);
      countryCount += recs.length;
    }

    manifest.push({
      country_code: countryCode,
      count: countryCount,
      state_codes: stateCodes.sort(),
      has_unassigned: hasUnassigned,
    });
    totalRecords += countryCount;
  }

  manifest.sort((a, b) => a.country_code.localeCompare(b.country_code));
  fs.writeFileSync(path.join(dataDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  commit();

  console.log('\n✅ Data generation complete!');
  console.log(`📊 Statistics:`);
  console.log(`   - Countries with postal codes: ${manifest.length}`);
  console.log(`   - Total records: ${totalRecords}`);
  console.log(`   - Output directory: ${finalDataDir}`);
}

// Main execution
const sourceFile = process.argv[2] || '/tmp/postcodes-data.json';
const outputDir = process.argv[3] || path.join(__dirname, '..');

if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Error: Source file not found: ${sourceFile}`);
  console.log('\nUsage: node generate-data.cjs <source-file> [output-dir]');
  process.exit(1);
}

generateSplitData(sourceFile, outputDir);
