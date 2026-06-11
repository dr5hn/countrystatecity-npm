#!/usr/bin/env node
/**
 * Generate translation data from source countries database
 * Extracts country name translations for all available locales
 *
 * Usage: node generate-data.cjs <source-file-path>
 * Example: node generate-data.cjs /tmp/countries-data.json
 */

const fs = require('fs');
const path = require('path');

async function generateTranslationData() {
  console.log('Generating translation data...\n');

  const sourceFile = process.argv[2];

  if (!sourceFile) {
    console.error('❌ Error: Source file path required');
    console.error('\nUsage: node generate-data.cjs <source-file-path>');
    console.error('Example: node generate-data.cjs /tmp/countries-data.json');
    process.exit(1);
  }

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Error: Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`📥 Loading source data from: ${sourceFile}`);
  const countries = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  console.log(`✓ Loaded ${countries.length} countries`);

  const localeSet = new Set();
  const translations = [];

  for (const country of countries) {
    if (!country.iso2 || !country.name) continue;

    // Strip empty translation values from source data
    const raw = country.translations || {};
    const localeMap = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v && v.trim())
    );

    const entry = {
      iso2: country.iso2.toUpperCase(),
      name: country.name,
      translations: localeMap,
    };

    for (const locale of Object.keys(entry.translations)) {
      localeSet.add(locale);
    }

    translations.push(entry);
  }

  // Sort by iso2
  translations.sort((a, b) => a.iso2.localeCompare(b.iso2));

  const outputFile = path.join(dataDir, 'translations.json');
  fs.writeFileSync(outputFile, JSON.stringify(translations, null, 2));

  const totalSize = (fs.statSync(outputFile).size / 1024).toFixed(2);
  const locales = Array.from(localeSet).sort();

  console.log(`\n✓ Written ${translations.length} countries to translations.json`);
  console.log('\n📊 Statistics:');
  console.log(`  Total countries: ${translations.length}`);
  console.log(`  Total locales: ${locales.length}`);
  console.log(`  Locales: ${locales.join(', ')}`);
  console.log(`  File size: ${totalSize} KB`);
  console.log('\n✨ Translation data generation complete!');
}

generateTranslationData().catch(error => {
  console.error('❌ Error generating translation data:', error);
  process.exit(1);
});
