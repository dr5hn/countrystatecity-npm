#!/usr/bin/env node
/**
 * Data generation script for @countrystatecity/geojson
 * Reads the countries server package's data and reshapes it into GeoJSON
 * Point FeatureCollections, flattened for CDN access (same layout as
 * countries-browser's generator, but each file is a GeoJSON FeatureCollection
 * instead of a plain array).
 *
 * Usage:
 *   node scripts/generate-data.cjs <server-data-dir>
 *   node scripts/generate-data.cjs ../countries/src/data
 */

const fs = require('fs');
const path = require('path');

const { beginStagedWrite } = require('../../../scripts/lib/staged-write.cjs');

/** True when a value is a fully-numeric, finite coordinate string. */
function isFiniteCoordinate(value) {
  // Number(), not parseFloat(): parseFloat('1.0N') silently truncates to 1,
  // and Number('N/A') is NaN which JSON.stringify would serialize as null —
  // spec-invalid GeoJSON. Number('') is 0, hence the explicit empty check.
  return value != null && value !== '' && Number.isFinite(Number(value));
}

/** Build a GeoJSON Point geometry from validated coordinate strings. */
function toPoint(latitude, longitude) {
  return {
    type: 'Point',
    coordinates: [Number(longitude), Number(latitude)],
  };
}

/** Wrap a geometry and properties into a GeoJSON Feature. */
function toFeature(geometry, properties) {
  return { type: 'Feature', geometry, properties };
}

/** Wrap features into a GeoJSON FeatureCollection. */
function toFeatureCollection(features) {
  return { type: 'FeatureCollection', features };
}

/** True when a record carries usable numeric coordinates. */
function hasCoordinates(record) {
  return isFiniteCoordinate(record.latitude) && isFiniteCoordinate(record.longitude);
}

/**
 * Warn (loudly, once per record) about records that HAVE coordinate values
 * that are not parseable numbers — silent skipping would hide upstream data
 * corruption until consumers hit broken maps.
 */
function warnInvalidCoordinates(records, label) {
  for (const r of records) {
    const hasAnyValue =
      (r.latitude != null && r.latitude !== '') || (r.longitude != null && r.longitude !== '');
    if (hasAnyValue && !hasCoordinates(r)) {
      console.warn(`⚠️  Skipping ${label} id=${r.id} (${r.name}): non-numeric coordinates lat=${JSON.stringify(r.latitude)} lon=${JSON.stringify(r.longitude)}`);
    }
  }
}

function generateGeoJSON(sourceDir, outputDir) {
  console.log(`📥 Reading server data from: ${sourceDir}`);

  // Staged then atomically swapped into place via commit() — a crash mid-run
  // never leaves the live output directory without a complete dataset.
  const finalDataDir = outputDir;
  const { stagingDir: dataDir, commit } = beginStagedWrite(finalDataDir);
  fs.mkdirSync(path.join(dataDir, 'states'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'cities'), { recursive: true });

  // 1. countries.geojson
  const countriesSource = path.join(sourceDir, 'countries.json');
  if (!fs.existsSync(countriesSource)) {
    console.error(`❌ Error: countries.json not found at ${countriesSource}`);
    process.exit(1);
  }
  const countries = JSON.parse(fs.readFileSync(countriesSource, 'utf-8'));
  warnInvalidCoordinates(countries, 'country');
  const skippedCountries = countries.filter((c) => !hasCoordinates(c)).length;
  const countryFeatures = countries.filter(hasCoordinates).map((c) =>
    toFeature(toPoint(c.latitude, c.longitude), {
      id: c.id,
      name: c.name,
      iso2: c.iso2,
      iso3: c.iso3,
    }),
  );
  fs.writeFileSync(
    path.join(dataDir, 'countries.geojson'),
    JSON.stringify(toFeatureCollection(countryFeatures)),
  );
  console.log(`✓ Created countries.geojson (${countryFeatures.length} features)`);

  // 2. Process each country directory
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const countryDirs = entries.filter((e) => e.isDirectory());

  let totalStateFeatures = 0;
  let totalCityFeatures = 0;
  let stateFiles = 0;
  let cityFiles = 0;
  let skippedStates = 0;
  let skippedCities = 0;

  for (const dir of countryDirs) {
    const parts = dir.name.split('-');
    const iso2 = parts[parts.length - 1];
    const countryPath = path.join(sourceDir, dir.name);

    // states.json -> states/{ISO2}.geojson
    const statesPath = path.join(countryPath, 'states.json');
    if (fs.existsSync(statesPath)) {
      const states = JSON.parse(fs.readFileSync(statesPath, 'utf-8'));
      warnInvalidCoordinates(states, 'state');
      skippedStates += states.filter((s) => !hasCoordinates(s)).length;
      const stateFeatures = states.filter(hasCoordinates).map((s) =>
        toFeature(toPoint(s.latitude, s.longitude), {
          id: s.id,
          name: s.name,
          iso2: s.iso2,
          country_code: s.country_code,
        }),
      );
      fs.writeFileSync(
        path.join(dataDir, 'states', `${iso2}.geojson`),
        JSON.stringify(toFeatureCollection(stateFeatures)),
      );
      totalStateFeatures += stateFeatures.length;
      stateFiles++;
    }

    // {StateName-CODE}/cities.json -> cities/{ISO2}-{CODE}.geojson
    const stateEntries = fs.readdirSync(countryPath, { withFileTypes: true });
    const stateDirs = stateEntries.filter((e) => e.isDirectory());

    for (const stateDir of stateDirs) {
      const stateParts = stateDir.name.split('-');
      const stateCode = stateParts[stateParts.length - 1];
      const citiesPath = path.join(countryPath, stateDir.name, 'cities.json');

      if (fs.existsSync(citiesPath)) {
        const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
        warnInvalidCoordinates(cities, 'city');
        skippedCities += cities.filter((c) => !hasCoordinates(c)).length;
        const cityFeatures = cities.filter(hasCoordinates).map((c) =>
          toFeature(toPoint(c.latitude, c.longitude), {
            id: c.id,
            name: c.name,
            state_code: c.state_code,
            country_code: c.country_code,
          }),
        );
        fs.writeFileSync(
          path.join(dataDir, 'cities', `${iso2}-${stateCode}.geojson`),
          JSON.stringify(toFeatureCollection(cityFeatures)),
        );
        totalCityFeatures += cityFeatures.length;
        cityFiles++;
      }
    }
  }

  commit();

  console.log('\n✅ GeoJSON generation complete!');
  console.log(`📊 Statistics:`);
  console.log(`   - Country features: ${countryFeatures.length} (${skippedCountries} skipped, no coordinates)`);
  console.log(`   - State files: ${stateFiles} (${totalStateFeatures} features, ${skippedStates} skipped)`);
  console.log(`   - City files: ${cityFiles} (${totalCityFeatures} features, ${skippedCities} skipped)`);
  console.log(`   - Output directory: ${finalDataDir}`);
}

// Exported for unit tests; the script body below only runs when executed directly.
module.exports = { isFiniteCoordinate, hasCoordinates, toPoint, toFeature, toFeatureCollection };

if (require.main === module) {
  const sourceDir = process.argv[2];
  const outputDir = process.argv[3] || path.join(__dirname, '..', 'src', 'data');

  if (!sourceDir) {
    console.error('❌ Error: Source data directory required');
    console.log('\nUsage: node scripts/generate-data.cjs <server-data-dir> [output-dir]');
    console.log('\nExample:');
    console.log('  node scripts/generate-data.cjs ../countries/src/data');
    process.exit(1);
  }

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  generateGeoJSON(sourceDir, outputDir);
}
