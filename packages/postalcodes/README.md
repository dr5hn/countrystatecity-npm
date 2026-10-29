# @countrystatecity/postalcodes

[![npm](https://img.shields.io/npm/v/@countrystatecity/postalcodes)](https://www.npmjs.com/package/@countrystatecity/postalcodes)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)

Official postal/ZIP code database with locality search, existence-based validation, and lazy loading.

**Environment:** 🖥️ **Server-side only** (Node.js, Next.js API routes, Express, etc.)

## Upgrading to 3.0.0

This version uses **v5.0.0-export.1**. Review the [upstream v5 migration notes](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v5.0.0) before updating stored IDs: some records were retired or had their identities repaired. City state links can now be null. Country-wide city loaders include these records. Preserve the supplied `NOTICE-*.txt` files with redistributed data. See the [package migration guide](https://github.com/dr5hn/countrystatecity-npm/blob/main/MIGRATING-V5.md).

## Earlier migration: 2.0.0

Data now comes from upstream **v4.0-export.50**. The v3.2 → v4.0 transition removed 4,486 city ids (duplicates, US counties moved to a separate counties dataset, and non-places), reassigned 7,527 cities to different states, and added 27 states while retiring 6. Stored ids and per-state results can change; US counties are no longer returned as cities. Later export corrections are included in this snapshot.

Before upgrading stored city/state ids, use [`removed_ids_v3.2_to_v4.0.csv`](https://github.com/dr5hn/countries-states-cities-database/releases/download/v4.0/removed_ids_v3.2_to_v4.0.csv) attached to the [upstream v4.0 release](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v4.0). It identifies merged ids and their survivors, counties moved to new ids, and retired states and their successors. Match the `record`, `outcome`, and `new_table` columns before using `new_id`; a county id is not a city id. Refresh stored state associations against this snapshot.

Postal-code records retain their own postal ids, but `state_code` and per-state file membership changed, including retired/replaced state codes in Italy and new assignments elsewhere. Re-query the manifest and refresh stored state codes before using per-state lookups. `city_id` remains deliberately omitted from this package even though upstream now supplies links on many records; use `locality_name` for this package's locality search.

## ✨ Features

- 📮 **725,993 postal codes** across 116 countries
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

// Search by place name — this package deliberately omits upstream
// city_id links, so locality_name is the search field here.
const places = await searchPostalCodesByLocalityInCountry('AD', 'Canillo');
```

## Local package or live API?

This package ships a free, offline-capable snapshot of the data — that's still the right choice when the app must work offline, a periodic snapshot is enough, or you just need simple lookups.

This package's postal code data isn't part of the live [CountryStateCity API](https://countrystatecity.in) yet. But if your app also needs countries, states, cities, currencies, phone codes, timezones, or fuzzy search, [`@countrystatecity/sdk`](https://www.npmjs.com/package/@countrystatecity/sdk) covers those live, with freshness, server-side search, and configurable rate limits beyond a bundled snapshot.

**Start free with 3,000 requests per month.** [Compare plans](https://countrystatecity.in/pricing?source=npm&campaign=sdk_api_migration&package=postalcodes) or [get an API key](https://app.countrystatecity.in?source=npm&campaign=sdk_api_migration&package=postalcodes).

```bash
npm install @countrystatecity/sdk
```

See the [full migration guide](https://github.com/dr5hn/countrystatecity-npm/blob/main/packages/sdk/MIGRATION.md) for what's covered today.

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
  locality_name: string | null;
  type: string;
  latitude: string | null;
  longitude: string | null;
}
```

`city_id` is intentionally omitted from this package projection; upstream v4.0 now links many postal codes to cities. Use upstream exports if you need those links.

## 📊 Data Source

Data from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database). Report data issues (wrong codes, missing localities) there — this package consumes that data, fixes happen upstream first.

## 📄 License

ODbL-1.0
