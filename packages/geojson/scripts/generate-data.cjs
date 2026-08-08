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

function toPoint(latitude, longitude) {
  return {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
  };
}

function toFeature(geometry, properties) {
  return { type: 'Feature', geometry, properties };
}

function toFeatureCollection(features) {
  return { type: 'FeatureCollection', features };
}

function hasCoordinates(record) {
  return record.latitude != null && record.latitude !== '' && record.longitude != null && record.longitude !== '';
}

function generateGeoJSON(sourceDir, outputDir) {
  console.log(`📥 Reading server data from: ${sourceDir}`);

  const dataDir = outputDir;
  if (fs.existsSync(dataDir)) {
    console.log('🗑️  Removing existing data directory...');
    fs.rmSync(dataDir, { recursive: true });
  }
  fs.mkdirSync(path.join(dataDir, 'states'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'cities'), { recursive: true });

  // 1. countries.geojson
  const countriesSource = path.join(sourceDir, 'countries.json');
  if (!fs.existsSync(countriesSource)) {
    console.error(`❌ Error: countries.json not found at ${countriesSource}`);
    process.exit(1);
  }
  const countries = JSON.parse(fs.readFileSync(countriesSource, 'utf-8'));
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

  console.log('\n✅ GeoJSON generation complete!');
  console.log(`📊 Statistics:`);
  console.log(`   - Country features: ${countryFeatures.length} (${skippedCountries} skipped, no coordinates)`);
  console.log(`   - State files: ${stateFiles} (${totalStateFeatures} features, ${skippedStates} skipped)`);
  console.log(`   - City files: ${cityFiles} (${totalCityFeatures} features, ${skippedCities} skipped)`);
  console.log(`   - Output directory: ${dataDir}`);
}

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
