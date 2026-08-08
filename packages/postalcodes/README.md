# @countrystatecity/postalcodes

[![npm](https://img.shields.io/npm/v/@countrystatecity/postalcodes)](https://www.npmjs.com/package/@countrystatecity/postalcodes)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)

Official postal/ZIP code database with locality search, existence-based validation, and lazy loading.

**Environment:** 🖥️ **Server-side only** (Node.js, Next.js API routes, Express, etc.)

## ✨ Features

- 📮 **844,000+ postal codes** across ~125 countries
- 🔎 **Locality search**: find postal codes by place name
- ✅ **Existence-based validation**: checks the real dataset, not a guessed format
- 🔄 **Lazy loading**: per-country, per-state files loaded on demand
- 📝 **TypeScript**: full type definitions included

### Why existence-based validation, not regex?

Some postal code packages validate format only (e.g. "5 digits"), which accepts codes that look right but don't exist. This package instead checks whether a code is actually present in the dataset for that country, which catches typos in otherwise-plausible codes. The tradeoff: a genuinely new/valid code not yet in the upstream database won't validate until the data is refreshed.

### Coverage note

Not every country has postal codes — only ~125 of 250 do, matching what upstream's postal-code dataset actually publishes. Use `getSupportedCountryCodes()` / `isCountrySupported()` to check before assuming a country is covered.

## 📦 Installation

```bash
npm install @countrystatecity/postalcodes
# or
yarn add @countrystatecity/postalcodes
# or
pnpm add @countrystatecity/postalcodes
```

> **⚠️ Server-Side Only**: This package requires Node.js file system access and cannot be used in browser environments.

> **⚠️ Serverless deployments (Vercel/Lambda)**: this package's data directory is ~120MB uncompressed (postal code coverage is far larger than the `countries` package's data). If your platform's bundler traces and includes the whole `dist/data/` tree rather than only the country subfolders actually read at runtime, this can approach serverless function size limits. Add `serverExternalPackages: ['@countrystatecity/postalcodes']` to `next.config.js` on Next.js/Vercel to prevent webpack from bundling it at all — see [`@countrystatecity/countries`' Vercel guide](https://github.com/dr5hn/countrystatecity-npm/tree/main/packages/countries#readme) for the general pattern.

## 🚀 Quick Start

```typescript
import {
  getSupportedCountryCodes,
  validatePostalCode,
  lookupPostalCode,
  searchPostalCodesByLocalityInCountry,
} from '@countrystatecity/postalcodes';

// Which countries have postal code data? (~125 of 250)
const supported = await getSupportedCountryCodes();

// Existence check — does this code actually exist for this country?
const isValid = await validatePostalCode('AD', 'AD100'); // true

// Look up a code — always returns an array, since codes can repeat
// across different localities within a country.
const matches = await lookupPostalCode('AD', 'AD100');
// [{ id: 1, code: 'AD100', country_code: 'AD', state_code: '02', locality_name: 'Canillo', ... }]

// Search by place name — there is no city_id linkage in the upstream
// data, so locality name is the practical way to find "codes near X".
const places = await searchPostalCodesByLocalityInCountry('AD', 'Canillo');
```

## 📖 API Reference

#### `getManifest()`
Lightweight list of every country with postal code data, plus per-country counts and state codes.
- **Returns:** `Promise<IPostalCodeManifestEntry[]>`

#### `getPostalCodesOfState(countryCode, stateCode)`
All postal codes for a specific country + state.
- **Returns:** `Promise<IPostalCode[]>`

#### `getUnassignedPostalCodesOfCountry(countryCode)`
Postal codes with no state subdivision in the upstream data (small territories, or a country's non-state-linked subset).
- **Returns:** `Promise<IPostalCode[]>`

#### `getAllPostalCodesOfCountry(countryCode)`
All postal codes for an entire country (every state file + the unassigned bucket). Can be large — Portugal alone is ~197K records.
- **Returns:** `Promise<IPostalCode[]>`

#### `validatePostalCode(countryCode, code, stateCode?)`
Existence check — does this code exist in the dataset? Not a format/regex check.
- **Returns:** `Promise<boolean>`

#### `lookupPostalCode(countryCode, code, stateCode?)`
All records matching an exact code. Always an array — codes are not guaranteed unique.
- **Returns:** `Promise<IPostalCode[]>`

#### `searchPostalCodesByLocality(countryCode, stateCode, searchTerm)` / `searchPostalCodesByLocalityInCountry(countryCode, searchTerm)`
Case-insensitive substring search on locality name.
- **Returns:** `Promise<IPostalCode[]>`

#### `getSupportedCountryCodes()` / `isCountrySupported(countryCode)`
Which countries have postal code data.
- **Returns:** `Promise<string[]>` / `Promise<boolean>`

## 🗂️ Data shape

```typescript
interface IPostalCode {
  id: number;
  code: string;
  country_code: string;
  state_code: string | null; // null when this record has no state subdivision
  locality_name: string;
  type: string;
  latitude: string | null;
  longitude: string | null;
}
```

`city_id` from the upstream source is intentionally omitted — it is null on 100% of upstream records and carries no usable information.

## 📊 Data Source

Data from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database). Report data issues (wrong codes, missing localities) there — this package consumes that data, fixes happen upstream first.

## 📄 License

ODbL-1.0
