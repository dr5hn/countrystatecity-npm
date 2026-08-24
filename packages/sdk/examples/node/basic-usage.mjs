// Run with: CSC_API_KEY=your-key node examples/node/basic-usage.mjs
import { createCSCClient } from '@countrystatecity/sdk';

const apiKey = process.env.CSC_API_KEY;
if (!apiKey) {
  console.error('Set CSC_API_KEY before running this example.');
  process.exit(1);
}

// The SDK never reads the key itself — the caller always passes it explicitly.
const csc = createCSCClient({ apiKey });

const { data: countries, meta } = await csc.countries.list({ limit: 5 });
console.log(`First ${countries.length} countries:`, countries.map((c) => c.name));
console.log('Rate limit usage:', meta.rateLimit);

const { data: india } = await csc.countries.get('IN');
console.log('India:', india.name, india.capital);

const { data: states } = await csc.states.list({ country: 'IN', limit: 5 });
console.log('Some Indian states:', states.map((s) => s.name));

const { data: matches } = await csc.search.fuzzy({ query: 'Banglore', type: 'city', country: 'IN', limit: 5 });
console.log('Fuzzy search for "Banglore":', matches.map((m) => m.name));
