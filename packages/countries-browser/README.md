# @countrystatecity/countries-browser

[![npm](https://img.shields.io/npm/v/@countrystatecity/countries-browser)](https://www.npmjs.com/package/@countrystatecity/countries-browser)
[![CI](https://github.com/dr5hn/countrystatecity-countries-browser/workflows/CI/badge.svg)](https://github.com/dr5hn/countrystatecity-countries-browser/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@countrystatecity/countries-browser)](https://www.npmjs.com/package/@countrystatecity/countries-browser)

Browser-native countries, states, and cities data with jsDelivr CDN and lazy loading. Same API as the server package — works in React, Vue, Svelte, Vite, and any browser environment.

**Environment:** 🌐 **Browser-native** (React, Vue, Svelte, Vite, and any browser environment)

## ✨ Features

- 🌍 **Complete Data**: 250+ countries, 5,000+ states, 150,000+ cities
- 🌐 **Browser-Native**: Runs directly in any browser via fetch and jsDelivr CDN
- 🚀 **Minimal Bundle**: <10KB initial load, lazy-load everything else
- 🔄 **Lazy Loading**: On-demand fetching — load only what you need
- 🌐 **Translations**: 18+ languages supported
- ⏰ **Timezone Data**: Full timezone information per location
- 📝 **TypeScript**: Full type definitions included
- 🔧 **Configurable**: Optional CDN override and cache tuning

## 📦 Installation

```bash
npm install @countrystatecity/countries-browser
# or
yarn add @countrystatecity/countries-browser
# or
pnpm add @countrystatecity/countries-browser
```

## 🚀 Quick Start

```typescript
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries-browser';

// Load all countries (~30KB gzipped)
const countries = await getCountries();
console.log(countries[0]);
// { id: 1, name: "United States", iso2: "US", emoji: "🇺🇸", ... }

// Load states for a country (on-demand)
const states = await getStatesOfCountry('US');
console.log(states[0]);
// { id: 1, name: "California", iso2: "CA", ... }

// Load cities for a state (on-demand)
const cities = await getCitiesOfState('US', 'CA');
console.log(cities[0]);
// { id: 1, name: "Los Angeles", latitude: "34.05", ... }
```

## 📖 API Reference

### Core Functions

#### `getCountries()`
Get lightweight list of all countries (basic info only).
- **Returns:** `Promise<ICountry[]>`

#### `getCountryByCode(code: string)`
Get full country metadata including timezones and translations.
- **Parameters:** `code` - ISO2 code (e.g., 'US')
- **Returns:** `Promise<ICountryMeta | null>`

#### `getStatesOfCountry(countryCode: string)`
Get all states/provinces for a country.
- **Parameters:** `countryCode` - ISO2 code
- **Returns:** `Promise<IState[]>`

#### `getStateByCode(countryCode: string, stateCode: string)`
Get specific state details.
- **Parameters:** `countryCode`, `stateCode`
- **Returns:** `Promise<IState | null>`

#### `getCitiesOfState(countryCode: string, stateCode: string)`
Get all cities in a specific state.
- **Parameters:** `countryCode`, `stateCode`
- **Returns:** `Promise<ICity[]>`

#### `getCityById(countryCode: string, stateCode: string, cityId: number)`
Get a specific city by its numeric ID.
- **Parameters:** `countryCode`, `stateCode`, `cityId`
- **Returns:** `Promise<ICity | null>`

#### `getAllCitiesOfCountry(countryCode: string)`
Get ALL cities in an entire country.
- **Warning:** Large data size, use sparingly
- **Returns:** `Promise<ICity[]>`

#### `getAllCitiesInWorld()`
Get every city globally.
- **Warning:** MASSIVE data (8MB+), rarely needed
- **Returns:** `Promise<ICity[]>`

### Utility Functions

#### `isValidCountryCode(code: string)`
Check if country code exists.
- **Returns:** `Promise<boolean>`

#### `isValidStateCode(countryCode: string, stateCode: string)`
Check if state code exists in a country.
- **Returns:** `Promise<boolean>`

#### `searchCitiesByName(countryCode: string, stateCode: string, term: string)`
Search cities by partial name match.
- **Returns:** `Promise<ICity[]>`

#### `getCountryNameByCode(code: string)`
Get country name from code.
- **Returns:** `Promise<string | null>`

#### `getStateNameByCode(countryCode: string, stateCode: string)`
Get state name from code.
- **Returns:** `Promise<string | null>`

#### `getTimezoneForCity(countryCode: string, stateCode: string, cityName: string)`
Get timezone for specific city.
- **Returns:** `Promise<string | null>`

#### `getCountryTimezones(countryCode: string)`
Get all timezones for a country.
- **Returns:** `Promise<string[]>`

### Configuration

```typescript
import { configure, resetConfiguration, clearCache } from '@countrystatecity/countries-browser';

// Self-host data instead of jsDelivr
configure({
  baseURL: 'https://my-cdn.com/data',
  timeout: 10000,
  cacheSize: 100,
});

// Reset to defaults
resetConfiguration();

// Clear in-memory cache
clearCache();
```

### React Example

```tsx
import { useState, useEffect } from 'react';
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries-browser';
import type { ICountry, IState, ICity } from '@countrystatecity/countries-browser';

export function LocationSelector() {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    getCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (!selectedCountry) { setStates([]); return; }
    getStatesOfCountry(selectedCountry).then(setStates);
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountry || !selectedState) { setCities([]); return; }
    getCitiesOfState(selectedCountry, selectedState).then(setCities);
  }, [selectedCountry, selectedState]);

  return (
    <div>
      <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedState(''); }}>
        <option value="">Select Country</option>
        {countries.map(c => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}
      </select>
      <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} disabled={!selectedCountry}>
        <option value="">Select State</option>
        {states.map(s => <option key={s.iso2} value={s.iso2}>{s.name}</option>)}
      </select>
      <select disabled={!selectedState}>
        <option value="">Select City</option>
        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}
```

### Error Handling

```typescript
import { getCountries, NetworkError } from '@countrystatecity/countries-browser';

try {
  const countries = await getCountries();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error(`CDN request failed: ${error.statusCode} at ${error.url}`);
  }
}
```

Invalid codes return `null` or `[]` gracefully — no exceptions thrown.

## 🔧 TypeScript Types

```typescript
import type { ICountry, ICountryMeta, IState, ICity, ITimezone } from '@countrystatecity/countries-browser';
```

## 📊 Bundle Size

| Action | Bundle Size |
|--------|-------------|
| Install & import | ~5KB |
| Load countries | ~30KB gzipped |
| Load US states | ~30KB |
| Load CA cities | ~15KB |
| **Typical usage** | **~50KB** |

### Server vs Browser Comparison

| | `@countrystatecity/countries` (server) | `@countrystatecity/countries-browser` |
|---|---|---|
| Environment | Node.js only | Browser + Node.js |
| Data loading | `fs.readFileSync` | `fetch()` from CDN |
| Initial bundle | ~5KB | ~5KB |
| Configuration | None needed | Optional CDN override |
| Lazy loading | Yes | Yes |

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

All packages include comprehensive tests:
- ✅ Unit tests
- ✅ Integration tests
- ✅ iOS/Safari compatibility tests

## 🔄 CI/CD & Automation

### Continuous Integration
Every push and PR automatically:
- ✅ Runs type checking
- ✅ Executes comprehensive tests
- ✅ Builds the package
- ✅ Validates bundle sizes
- ✅ Tests iOS/Safari compatibility

### Automated Publishing
Automated publishing to NPM on version changes:
- 🔍 Detects version bumps in package.json
- 📦 Builds and tests before publishing
- 🚀 Publishes to NPM registry
- 🏷️ Creates GitHub release with changelog

## 📄 License

[ODbL-1.0](LICENSE) © [dr5hn](https://github.com/dr5hn)

This package and its data are licensed under the Open Database License (ODbL) v1.0. The data is sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database) which is also licensed under ODbL-1.0.

You are free to share, create, and adapt this database as long as you attribute the original sources, distribute adaptations under the same license, and don't use technical restrictions to lock down the data.

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

**For data-related issues** (incorrect country names, missing cities, wrong coordinates, etc.), please report them to the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database/issues) repository, which is the source of data for this package.

## 📦 Package Ecosystem

This package is part of the [@countrystatecity package ecosystem](https://github.com/dr5hn/countrystatecity-countries):

- **[@countrystatecity/countries](https://www.npmjs.com/package/@countrystatecity/countries)** — Server-side countries, states, and cities database. Environment: Node.js, Next.js API routes, Express. Bundle: <10KB initial load.

- **[@countrystatecity/countries-browser](https://www.npmjs.com/package/@countrystatecity/countries-browser)** (This package) — Browser-native version with jsDelivr CDN and lazy loading. Environment: React, Vue, Svelte, Vite, any browser. Same API as the server package — zero config, just import and use.

- **[@countrystatecity/timezones](https://www.npmjs.com/package/@countrystatecity/timezones)** — Comprehensive timezone data with conversion utilities. Environment: Server-side only. Bundle: <20KB initial load.

## 🔗 Links

- [GitHub Repository](https://github.com/dr5hn/countrystatecity-countries-browser)
- [Issues](https://github.com/dr5hn/countrystatecity-countries-browser/issues)
- [NPM Package](https://www.npmjs.com/package/@countrystatecity/countries-browser)
- [NPM Organization](https://www.npmjs.com/org/countrystatecity)
