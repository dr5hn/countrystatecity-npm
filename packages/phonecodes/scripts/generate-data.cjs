#!/usr/bin/env node
/**
 * Generate phonecode data from source countries database.
 *
 * Usage: node generate-data.cjs <source-file-path>
 * Example: node generate-data.cjs /tmp/countries-data.json
 */

const fs = require('fs');
const path = require('path');

async function generatePhonecodeData() {
  console.log('Generating phonecode data...\n');

  const sourceFile = process.argv[2];

  if (!sourceFile) {
    console.error('❌ Error: Source file path required');
    console.error('\nUsage: node generate-data.cjs <source-file-path>');
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

  const phonecodes = [];

  for (const country of countries) {
    const phonecode = String(country.phonecode || '').trim();
    if (!phonecode) continue;

    phonecodes.push({
      iso2: country.iso2,
      name: country.name,
      dialCode: `+${phonecode}`,
      phonecode,
    });
  }

  phonecodes.sort((a, b) => a.iso2.localeCompare(b.iso2));

  const outFile = path.join(dataDir, 'phonecodes.json');
  fs.writeFileSync(outFile, JSON.stringify(phonecodes, null, 2));

  const sizeKB = (fs.statSync(outFile).size / 1024).toFixed(2);
  console.log(`\n✓ Written ${phonecodes.length} entries to phonecodes.json (${sizeKB} KB)`);
  console.log('\n✨ Phonecode data generation complete!');
}

generatePhonecodeData().catch((error) => {
  console.error('❌ Error generating phonecode data:', error);
  process.exit(1);
});
