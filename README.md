# countrystatecity-npm

[![Pipeline](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)
[![License: ODbL-1.0](https://img.shields.io/badge/License-ODbL--1.0-blue.svg)](https://github.com/dr5hn/countrystatecity-npm/blob/main/LICENSE)

[![](https://img.shields.io/npm/dt/@countrystatecity/countries?label=countries)](https://www.npmjs.com/package/@countrystatecity/countries)
[![](https://img.shields.io/npm/dt/@countrystatecity/countries-browser?label=countries-browser)](https://www.npmjs.com/package/@countrystatecity/countries-browser)
[![](https://img.shields.io/npm/dt/@countrystatecity/timezones?label=timezones)](https://www.npmjs.com/package/@countrystatecity/timezones)
[![](https://img.shields.io/npm/dt/@countrystatecity/currencies?label=currencies)](https://www.npmjs.com/package/@countrystatecity/currencies)
[![](https://img.shields.io/npm/dt/@countrystatecity/translations?label=translations)](https://www.npmjs.com/package/@countrystatecity/translations)
[![](https://img.shields.io/npm/dt/@countrystatecity/phonecodes?label=phonecodes)](https://www.npmjs.com/package/@countrystatecity/phonecodes)
[![](https://img.shields.io/npm/dt/@countrystatecity/postalcodes?label=postalcodes)](https://www.npmjs.com/package/@countrystatecity/postalcodes)
[![](https://img.shields.io/npm/dt/@countrystatecity/geojson?label=geojson)](https://www.npmjs.com/package/@countrystatecity/geojson)
[![](https://img.shields.io/npm/dt/@countrystatecity/cli?label=cli)](https://www.npmjs.com/package/@countrystatecity/cli)
[![](https://img.shields.io/npm/dt/@countrystatecity/sdk?label=sdk)](https://www.npmjs.com/package/@countrystatecity/sdk)

Monorepo for the `@countrystatecity` npm package ecosystem — countries, states, cities, regions, timezones, currencies, translations, phone codes, postal codes, GeoJSON, a CLI tool, and an official REST API SDK. All data is sourced from [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) and updated automatically every week.

---

## Packages

| Package | Description | Environment | Bundle |
|---|---|---|---|
| [`@countrystatecity/countries`](https://www.npmjs.com/package/@countrystatecity/countries) | Countries, states, cities with lazy loading | Node.js / Server | <10KB |
| [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser) | Same API as above, loads data via jsDelivr CDN | Browser / Any | <10KB |
| [`@countrystatecity/timezones`](https://www.npmjs.com/package/@countrystatecity/timezones) | 392 IANA timezones with conversion utilities | Node.js / Server | <20KB |
| [`@countrystatecity/currencies`](https://www.npmjs.com/package/@countrystatecity/currencies) | 155 ISO 4217 currencies with symbols & formatting | Node.js / Browser | <3KB |
| [`@countrystatecity/translations`](https://www.npmjs.com/package/@countrystatecity/translations) | Country name translations in 19 languages | Node.js / Browser | <3KB |
| [`@countrystatecity/phonecodes`](https://www.npmjs.com/package/@countrystatecity/phonecodes) | 250 country phone/dial codes with lookup, reverse lookup & formatting | Node.js / Browser | <3KB |
| [`@countrystatecity/postalcodes`](https://www.npmjs.com/package/@countrystatecity/postalcodes) | 844,000+ postal codes across 125 countries with locality search & validation | Node.js / Server | Lazy-loaded |
| [`@countrystatecity/geojson`](https://www.npmjs.com/package/@countrystatecity/geojson) | Countries/states/cities as GeoJSON `Point` FeatureCollections (no boundary polygons) | Browser / Any | Lazy-loaded |
| [`@countrystatecity/cli`](https://www.npmjs.com/package/@countrystatecity/cli) | CLI to search, explore, and generate code from geographic data | Terminal | – |
| [`@countrystatecity/sdk`](https://www.npmjs.com/package/@countrystatecity/sdk) | Official client SDK for the live CountryStateCity REST API — search, usage, and quota-aware data | Node.js / Browser | – |

---

## Quick Install

```bash
# Countries & states & cities (server-side)
npm install @countrystatecity/countries

# Countries & states & cities (browser / React / Vue / Svelte)
npm install @countrystatecity/countries-browser

# Timezones
npm install @countrystatecity/timezones

# Currencies
npm install @countrystatecity/currencies

# Translations
npm install @countrystatecity/translations

# Phone codes
npm install @countrystatecity/phonecodes

# Postal codes
npm install @countrystatecity/postalcodes

# GeoJSON (browser / mapping libraries)
npm install @countrystatecity/geojson

# CLI (global install)
npm install -g @countrystatecity/cli

# Official REST API SDK (requires a free API key)
npm install @countrystatecity/sdk
```

---

## Usage Examples

### Countries, States & Cities

```typescript
// Server-side (Node.js, Next.js API routes, Express)
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries';

// Browser (React, Vue, Svelte, Vite)
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries-browser';

const countries = await getCountries();
// [{ id: 101, name: 'India', iso2: 'IN', emoji: '🇮🇳', ... }, ...]

const states = await getStatesOfCountry('US');
// [{ id: 1, name: 'California', iso2: 'CA', ... }, ...]

const cities = await getCitiesOfState('US', 'CA');
// [{ id: 110992, name: 'Los Angeles', latitude: '34.05', longitude: '-118.24', ... }, ...]

// Regions & subregions
import { getRegions, getCountriesByRegion } from '@countrystatecity/countries';

const regions = await getRegions();
// [{ id: 4, name: 'Europe', translations: {...}, wikiDataId: 'Q46' }, ...]

const europeanCountries = await getCountriesByRegion('Europe');
// [{ id: 6, name: 'Andorra', iso2: 'AD', region: 'Europe', ... }, ...]
```

## Local package or live API?

These packages ship a free, offline-capable snapshot of the data — that's still the right choice when the app must work offline, a periodic snapshot is enough, or you just need simple lookups/dropdowns.

The [CountryStateCity API](https://countrystatecity.in) is worth adding alongside them when you need:
- **Freshness** — data that updates without publishing a new package version.
- **Search** — fuzzy, typo-tolerant, server-side search (`csc.search.fuzzy(...)`), not just exact-match local lookups.
- **Scale & support** — configurable rate limits and support beyond a bundled snapshot.

**Start free with 3,000 requests per month.** [Compare plans](https://countrystatecity.in/pricing?source=npm&campaign=sdk_api_migration&package=countries) or [get an API key](https://app.countrystatecity.in?source=npm&campaign=sdk_api_migration&package=countries).

```bash
npm install @countrystatecity/sdk
```

```typescript
// Before
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries';

const countries = await getCountries();
const states = await getStatesOfCountry('US');
const cities = await getCitiesOfState('US', 'CA');
```

```typescript
// After
import { createCSCClient } from '@countrystatecity/sdk';

const csc = createCSCClient({ apiKey: process.env.CSC_API_KEY! });

const { data: countries } = await csc.countries.list();
const { data: states } = await csc.states.list({ country: 'US' });
const { data: cities } = await csc.cities.list({ country: 'US', state: 'CA' });
```

See the [full migration guide](https://github.com/dr5hn/countrystatecity-npm/blob/main/packages/sdk/MIGRATION.md) for error handling, retries, and more.

### Timezones

```typescript
import { getTimezonesByCountry, convertTime, getCurrentTime } from '@countrystatecity/timezones';

const tzs = await getTimezonesByCountry('US');
// [{ zoneName: 'America/New_York', abbreviation: 'EST', gmtOffset: -18000, ... }, ...]

const result = await convertTime('2025-10-18T12:00:00Z', 'America/New_York', 'Europe/London');
// { originalTime: '2025-10-18T08:00:00', convertedTime: '2025-10-18T13:00:00', timeDifference: 5 }

const now = await getCurrentTime('Asia/Tokyo');
// "2025-10-18T21:00:00.000Z"
```

### Currencies

```typescript
import { getCurrencyByCode, formatCurrencyAmount, getCurrenciesByCountry } from '@countrystatecity/currencies';

const usd = await getCurrencyByCode('USD');
// { code: 'USD', name: 'US Dollar', symbol: '$', decimalDigits: 2, ... }

const formatted = await formatCurrencyAmount(1234.5, 'USD');
// "$1,234.50"

const currencies = await getCurrenciesByCountry('IN');
// [{ code: 'INR', name: 'Indian Rupee', symbol: '₹', ... }]
```

### Phone Codes

```typescript
import {
  getPhonecodeByCountry,
  getCountriesByDialCode,
  formatWithDialCode,
} from '@countrystatecity/phonecodes';

const india = await getPhonecodeByCountry('IN');
// { iso2: 'IN', name: 'India', dialCode: '+91', phonecode: '91' }

const countries = await getCountriesByDialCode('+1');
// [{ iso2: 'US', ... }, { iso2: 'CA', ... }, ...]

const formatted = await formatWithDialCode('9876543210', 'IN');
// "+91 9876543210"
```

### CLI

```bash
# Install globally
npm install -g @countrystatecity/cli

# Authenticate with your free API key (https://app.countrystatecity.in?source=npm&campaign=sdk_api_migration&package=cli)
csc auth login

# Search countries, states, cities
csc search countries
csc search states --country IN
csc search cities --country IN --state MH

# Get detailed info
csc get country US --json

# Interactive browser: pick country → state → view cities / generate code
csc explore

# Generate a React dropdown or Prisma seed (Supporter plan+)
csc generate dropdown -e countries -f react
csc generate seed -e states -f prisma --country IN

# Open the online bulk export tool
csc export
```

### Translations

```typescript
import { getTranslation, getTranslationOrFallback, getCountryTranslations } from '@countrystatecity/translations';

const name = await getTranslation('DE', 'fr');
// "Allemagne"

const entry = await getCountryTranslations('JP');
// { iso2: 'JP', name: 'Japan', translations: { fr: 'Japon', de: 'Japan', zh-CN: '日本', ... } }

getTranslationOrFallback(entry, 'hi');   // "जापान"
getTranslationOrFallback(entry, 'xx');   // "Japan"  ← falls back to English
```

### Postal Codes

```typescript
import {
  validatePostalCode,
  lookupPostalCode,
  searchPostalCodesByLocalityInCountry,
} from '@countrystatecity/postalcodes';

const isValid = await validatePostalCode('AD', 'AD100');
// true — existence check against the real dataset, not a format regex

const matches = await lookupPostalCode('AD', 'AD100');
// [{ code: 'AD100', locality_name: 'Canillo', state_code: '02', ... }]

const places = await searchPostalCodesByLocalityInCountry('AD', 'Canillo');
// [{ code: 'AD100', locality_name: 'Canillo', ... }]
```

### GeoJSON

```typescript
import { getCountriesGeoJSON, getStatesGeoJSON } from '@countrystatecity/geojson';

const countries = await getCountriesGeoJSON();
// { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [-97, 38] }, properties: { id: 233, name: 'United States', iso2: 'US', iso3: 'USA' } }, ...] }

// Drop straight into Leaflet: L.geoJSON(countries).addTo(map);

const states = await getStatesGeoJSON('US');
```

> Note: these are `Point` features (one coordinate per country/state/city), not boundary polygons — there's no shape/outline data available upstream for choropleth-style rendering.

---

## Data Coverage

| Dataset | Count |
|---|---|
| Countries | 250 |
| States / Provinces | 5,000+ |
| Cities | 150,000+ |
| Regions (continents) | 6 |
| Subregions | 22 |
| IANA Timezones | 392 |
| ISO 4217 Currencies | 155 |
| Translation Locales | 19 |
| Phone Codes | 250 |
| Postal Codes | 844,000+ across 125 countries |

**Locales:** `ar`, `br`, `de`, `es`, `fa`, `fr`, `hi`, `hr`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `tr`, `uk`, `zh-CN`

---

## Monorepo Structure

```
countrystatecity-npm/
├── packages/
│   ├── countries/           # @countrystatecity/countries
│   ├── countries-browser/   # @countrystatecity/countries-browser
│   ├── timezones/           # @countrystatecity/timezones
│   ├── currencies/          # @countrystatecity/currencies
│   ├── translations/        # @countrystatecity/translations
│   ├── phonecodes/          # @countrystatecity/phonecodes
│   ├── postalcodes/         # @countrystatecity/postalcodes
│   ├── geojson/             # @countrystatecity/geojson
│   ├── cli/                 # @countrystatecity/cli
│   └── sdk/                 # @countrystatecity/sdk
├── scripts/
│   ├── fetch-database.cjs   # Downloads latest combined source JSON
│   ├── fetch-postcodes.cjs  # Downloads latest postal codes JSON (separate release asset)
│   └── generate-all.cjs     # Runs all package data generators
├── data/
│   ├── source.json          # Raw source (git-ignored, fetched by CI)
│   └── postcodes-source.json # Raw postal codes source (git-ignored, fetched manually)
├── .github/workflows/
│   ├── ci.yml               # Pipeline: fetch → generate → typecheck → build → test → open PR
│   ├── release.yml          # Triggered on data-update PR merge → bumps versions + changelogs
│   └── publish.yml          # Triggered on version bump commit → builds + publishes to npm
└── turbo.json               # Turborepo task graph
```

---

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
git clone https://github.com/dr5hn/countrystatecity-npm.git
cd countrystatecity-npm
pnpm install
```

### Commands

```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Type check all packages
pnpm typecheck

# Build in watch mode
pnpm dev
```

### Updating Data Locally

```bash
# 1. Fetch the latest source database
pnpm fetch-database

# 1b. Optional: fetch postal codes too (large: ~9MB gz / ~324MB decompressed,
#     kept separate since most contributors don't need it)
pnpm fetch-postcodes

# 2. Generate data for all packages (skips postalcodes if 1b wasn't run)
pnpm generate-data

# 3. Build and test
pnpm build
pnpm test
```

### Working on a Single Package

```bash
cd packages/countries
pnpm test           # run tests
pnpm build          # build
pnpm typecheck      # type check
```

---

## CI/CD Pipeline

### On every push / pull request to `main`

```
typecheck → build → test
```

Validates code on every change. No publish.

---

### Every Sunday at 00:00 UTC (or manual trigger)

#### If data has NOT changed

```
fetch-data → generate-data → typecheck → build → test
```

CI validates everything and stops. No PR is opened, nothing is published.

#### If data HAS changed

**Step 1 — `ci.yml`** fetches, validates, and opens a PR:

```
fetch-data → generate-data → typecheck → build → test → open PR
```

A pull request titled **"Automated Data Update"** is opened with the `data-update` label. Review the data diff and merge when ready.

**Step 2 — `release.yml`** fires automatically when the PR is merged:

```
bump all package versions (patch) → update CHANGELOGs → commit to main
```

**Step 3 — `publish.yml`** fires automatically when the version commit lands on `main`:

```
build all packages → publish to npm → create GitHub releases
```

> Each package (including `@countrystatecity/cli`) is published only if its current version is not already on npm, so re-runs are always safe.

---

### Manual release (code-only changes)

Go to **Actions → Release → Run workflow** on GitHub. Once `release.yml` commits the version bump, `publish.yml` fires automatically.

---

## Downloads

| Package | Monthly | Weekly |
|---|---|---|
| `@countrystatecity/countries` | [![](https://img.shields.io/npm/dm/@countrystatecity/countries?label=countries)](https://www.npmjs.com/package/@countrystatecity/countries) | [![](https://img.shields.io/npm/dw/@countrystatecity/countries?label=countries)](https://www.npmjs.com/package/@countrystatecity/countries) |
| `@countrystatecity/countries-browser` | [![](https://img.shields.io/npm/dm/@countrystatecity/countries-browser?label=countries-browser)](https://www.npmjs.com/package/@countrystatecity/countries-browser) | [![](https://img.shields.io/npm/dw/@countrystatecity/countries-browser?label=countries-browser)](https://www.npmjs.com/package/@countrystatecity/countries-browser) |
| `@countrystatecity/timezones` | [![](https://img.shields.io/npm/dm/@countrystatecity/timezones?label=timezones)](https://www.npmjs.com/package/@countrystatecity/timezones) | [![](https://img.shields.io/npm/dw/@countrystatecity/timezones?label=timezones)](https://www.npmjs.com/package/@countrystatecity/timezones) |
| `@countrystatecity/currencies` | [![](https://img.shields.io/npm/dm/@countrystatecity/currencies?label=currencies)](https://www.npmjs.com/package/@countrystatecity/currencies) | [![](https://img.shields.io/npm/dw/@countrystatecity/currencies?label=currencies)](https://www.npmjs.com/package/@countrystatecity/currencies) |
| `@countrystatecity/translations` | [![](https://img.shields.io/npm/dm/@countrystatecity/translations?label=translations)](https://www.npmjs.com/package/@countrystatecity/translations) | [![](https://img.shields.io/npm/dw/@countrystatecity/translations?label=translations)](https://www.npmjs.com/package/@countrystatecity/translations) |
| `@countrystatecity/phonecodes` | [![](https://img.shields.io/npm/dm/@countrystatecity/phonecodes?label=phonecodes)](https://www.npmjs.com/package/@countrystatecity/phonecodes) | [![](https://img.shields.io/npm/dw/@countrystatecity/phonecodes?label=phonecodes)](https://www.npmjs.com/package/@countrystatecity/phonecodes) |
| `@countrystatecity/postalcodes` | [![](https://img.shields.io/npm/dm/@countrystatecity/postalcodes?label=postalcodes)](https://www.npmjs.com/package/@countrystatecity/postalcodes) | [![](https://img.shields.io/npm/dw/@countrystatecity/postalcodes?label=postalcodes)](https://www.npmjs.com/package/@countrystatecity/postalcodes) |
| `@countrystatecity/geojson` | [![](https://img.shields.io/npm/dm/@countrystatecity/geojson?label=geojson)](https://www.npmjs.com/package/@countrystatecity/geojson) | [![](https://img.shields.io/npm/dw/@countrystatecity/geojson?label=geojson)](https://www.npmjs.com/package/@countrystatecity/geojson) |
| `@countrystatecity/cli` | [![](https://img.shields.io/npm/dm/@countrystatecity/cli?label=cli)](https://www.npmjs.com/package/@countrystatecity/cli) | [![](https://img.shields.io/npm/dw/@countrystatecity/cli?label=cli)](https://www.npmjs.com/package/@countrystatecity/cli) |
| `@countrystatecity/sdk` | [![](https://img.shields.io/npm/dm/@countrystatecity/sdk?label=sdk)](https://www.npmjs.com/package/@countrystatecity/sdk) | [![](https://img.shields.io/npm/dw/@countrystatecity/sdk?label=sdk)](https://www.npmjs.com/package/@countrystatecity/sdk) |

---

## Related Projects

- [countrystatecity-npm](https://github.com/dr5hn/countrystatecity-npm) — This repo (npm packages)
- [countrystatecity-pypi](https://github.com/dr5hn/countrystatecity-pypi) — Python packages (PyPI)
- [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) — Upstream data source

---

## Data Issues

All geographic data (country names, city coordinates, timezone offsets, etc.) comes from the upstream [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database). Report data issues there, not here.

---

## License

[ODbL-1.0](./LICENSE) © [dr5hn](https://github.com/dr5hn)

Data is licensed under the [Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/). You are free to share and adapt the data as long as you attribute the source, share adaptations under the same license, and keep the data open.
