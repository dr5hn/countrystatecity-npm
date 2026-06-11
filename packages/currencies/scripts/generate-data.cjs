#!/usr/bin/env node
/**
 * Generate currency data from source countries database
 * Extracts currency information and maps which countries use each currency
 *
 * Usage: node generate-data.cjs <source-file-path>
 * Example: node generate-data.cjs /tmp/countries-data.json
 */

const fs = require('fs');
const path = require('path');

async function generateCurrencyData() {
  console.log('Generating currency data...\n');

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

  // Load master source data
  console.log(`📥 Loading source data from: ${sourceFile}`);
  const countries = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  console.log(`✓ Loaded ${countries.length} countries`);

  // Load existing currencies.json as supplement for fields not in master DB
  // (namePlural, symbolNative, decimalDigits, rounding)
  const existingFile = path.join(dataDir, 'currencies.json');
  const supplement = new Map();
  if (fs.existsSync(existingFile)) {
    const existing = JSON.parse(fs.readFileSync(existingFile, 'utf-8'));
    for (const c of existing) {
      supplement.set(c.code, c);
    }
    console.log(`✓ Loaded ${supplement.size} existing currencies as supplement`);
  }

  // Build currency map from master source
  const currencyMap = new Map();

  for (const country of countries) {
    if (!country.currency || !country.currency_name) continue;

    const code = country.currency.toUpperCase();

    if (!currencyMap.has(code)) {
      const existing = supplement.get(code);
      currencyMap.set(code, {
        code,
        name: country.currency_name,
        namePlural: existing?.namePlural ?? country.currency_name,
        symbol: country.currency_symbol || code,
        symbolNative: existing?.symbolNative ?? country.currency_symbol ?? code,
        decimalDigits: existing?.decimalDigits ?? 2,
        rounding: existing?.rounding ?? 0,
        countries: [],
      });
    }

    // Add this country to the currency's countries list
    const currency = currencyMap.get(code);
    if (!currency.countries.includes(country.iso2)) {
      currency.countries.push(country.iso2);
    }
  }

  // Sort countries arrays and output array by code
  const currencies = Array.from(currencyMap.values())
    .map(c => ({ ...c, countries: c.countries.sort() }))
    .sort((a, b) => a.code.localeCompare(b.code));

  fs.writeFileSync(existingFile, JSON.stringify(currencies, null, 2));

  console.log(`\n✓ Written ${currencies.length} currencies to currencies.json`);

  const totalSize = (fs.statSync(existingFile).size / 1024).toFixed(2);
  const totalCountries = currencies.reduce((acc, c) => acc + c.countries.length, 0);

  console.log('\n📊 Statistics:');
  console.log(`  Total currencies: ${currencies.length}`);
  console.log(`  Total country mappings: ${totalCountries}`);
  console.log(`  File size: ${totalSize} KB`);
  console.log('\n✨ Currency data generation complete!');
}

generateCurrencyData().catch(error => {
  console.error('❌ Error generating currency data:', error);
  process.exit(1);
});
