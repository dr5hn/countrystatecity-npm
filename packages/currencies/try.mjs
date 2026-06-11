import {
  getCurrencies,
  getCurrencyByCode,
  getCurrenciesByCountry,
  getCurrencySymbol,
  isValidCurrencyCode,
  searchCurrencies,
} from './dist/index.js';

// 1. All currencies (show first 5)
const all = await getCurrencies();
console.log('--- All currencies (first 5) ---');
console.log(all.slice(0, 5));

// 2. Single currency by code
console.log('\n--- getCurrencyByCode("USD") ---');
console.log(await getCurrencyByCode('USD'));

// 3. Currencies used in India
console.log('\n--- getCurrenciesByCountry("IN") ---');
console.log(await getCurrenciesByCountry('IN'));

// 4. Symbol only
console.log('\n--- getCurrencySymbol("EUR") ---');
console.log(await getCurrencySymbol('EUR'));

// 5. Validate a code
console.log('\n--- isValidCurrencyCode("GBP") ---');
console.log(await isValidCurrencyCode('GBP'));
console.log('\n--- isValidCurrencyCode("XYZ") ---');
console.log(await isValidCurrencyCode('XYZ'));

// 6. Search
console.log('\n--- searchCurrencies("franc") ---');
const francs = await searchCurrencies('franc');
console.log(francs.map(c => `${c.code} - ${c.name}`));
