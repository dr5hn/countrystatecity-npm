# countrystatecity-npm

[![Pipeline](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)
[![License: ODbL-1.0](https://img.shields.io/badge/License-ODbL--1.0-blue.svg)](https://github.com/dr5hn/countrystatecity-npm/blob/main/LICENSE)

[![](https://img.shields.io/npm/dm/@countrystatecity/countries?label=countries)](https://www.npmjs.com/package/@countrystatecity/countries)
[![](https://img.shields.io/npm/dw/@countrystatecity/countries?label=countries%2Fweek)](https://www.npmjs.com/package/@countrystatecity/countries)
[![](https://img.shields.io/npm/dm/@countrystatecity/countries-browser?label=countries-browser)](https://www.npmjs.com/package/@countrystatecity/countries-browser)
[![](https://img.shields.io/npm/dw/@countrystatecity/countries-browser?label=countries-browser%2Fweek)](https://www.npmjs.com/package/@countrystatecity/countries-browser)
[![](https://img.shields.io/npm/dm/@countrystatecity/timezones?label=timezones)](https://www.npmjs.com/package/@countrystatecity/timezones)
[![](https://img.shields.io/npm/dw/@countrystatecity/timezones?label=timezones%2Fweek)](https://www.npmjs.com/package/@countrystatecity/timezones)
[![](https://img.shields.io/npm/dm/@countrystatecity/currencies?label=currencies)](https://www.npmjs.com/package/@countrystatecity/currencies)
[![](https://img.shields.io/npm/dw/@countrystatecity/currencies?label=currencies%2Fweek)](https://www.npmjs.com/package/@countrystatecity/currencies)
[![](https://img.shields.io/npm/dm/@countrystatecity/translations?label=translations)](https://www.npmjs.com/package/@countrystatecity/translations)
[![](https://img.shields.io/npm/dw/@countrystatecity/translations?label=translations%2Fweek)](https://www.npmjs.com/package/@countrystatecity/translations)
[![](https://img.shields.io/npm/dm/@countrystatecity/phonecodes?label=phonecodes)](https://www.npmjs.com/package/@countrystatecity/phonecodes)
[![](https://img.shields.io/npm/dw/@countrystatecity/phonecodes?label=phonecodes%2Fweek)](https://www.npmjs.com/package/@countrystatecity/phonecodes)
[![](https://img.shields.io/npm/dm/@countrystatecity/cli?label=cli)](https://www.npmjs.com/package/@countrystatecity/cli)
[![](https://img.shields.io/npm/dw/@countrystatecity/cli?label=cli%2Fweek)](https://www.npmjs.com/package/@countrystatecity/cli)

Monorepo for the `@countrystatecity` npm package ecosystem — countries, states, cities, timezones, currencies, translations, phone codes, and a CLI tool. All data is sourced from [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) and updated automatically every week.

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
| [`@countrystatecity/cli`](https://www.npmjs.com/package/@countrystatecity/cli) | CLI to search, explore, and generate code from geographic data | Terminal | – |

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

# CLI (global install)
npm install -g @countrystatecity/cli
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
```

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

# Authenticate with your free API key (https://app.countrystatecity.in)
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

---

## Data Coverage

| Dataset | Count |
|---|---|
| Countries | 250 |
| States / Provinces | 5,000+ |
| Cities | 150,000+ |
| IANA Timezones | 392 |
| ISO 4217 Currencies | 155 |
| Translation Locales | 19 |
| Phone Codes | 250 |

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
│   └── cli/                 # @countrystatecity/cli
├── scripts/
│   ├── fetch-database.cjs   # Downloads latest source JSON
│   └── generate-all.cjs     # Runs all package data generators
├── data/
│   └── source.json          # Raw source (git-ignored, fetched by CI)
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

# 2. Generate data for all packages
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
| `@countrystatecity/countries` | [![](https://img.shields.io/npm/dm/@countrystatecity/countries?label=countries)](https://www.npmjs.com/package/@countrystatecity/countries) | [![](https://img.shields.io/npm/dw/@countrystatecity/countries?label=countries%2Fweek)](https://www.npmjs.com/package/@countrystatecity/countries) |
| `@countrystatecity/countries-browser` | [![](https://img.shields.io/npm/dm/@countrystatecity/countries-browser?label=countries-browser)](https://www.npmjs.com/package/@countrystatecity/countries-browser) | [![](https://img.shields.io/npm/dw/@countrystatecity/countries-browser?label=countries-browser%2Fweek)](https://www.npmjs.com/package/@countrystatecity/countries-browser) |
| `@countrystatecity/timezones` | [![](https://img.shields.io/npm/dm/@countrystatecity/timezones?label=timezones)](https://www.npmjs.com/package/@countrystatecity/timezones) | [![](https://img.shields.io/npm/dw/@countrystatecity/timezones?label=timezones%2Fweek)](https://www.npmjs.com/package/@countrystatecity/timezones) |
| `@countrystatecity/currencies` | [![](https://img.shields.io/npm/dm/@countrystatecity/currencies?label=currencies)](https://www.npmjs.com/package/@countrystatecity/currencies) | [![](https://img.shields.io/npm/dw/@countrystatecity/currencies?label=currencies%2Fweek)](https://www.npmjs.com/package/@countrystatecity/currencies) |
| `@countrystatecity/translations` | [![](https://img.shields.io/npm/dm/@countrystatecity/translations?label=translations)](https://www.npmjs.com/package/@countrystatecity/translations) | [![](https://img.shields.io/npm/dw/@countrystatecity/translations?label=translations%2Fweek)](https://www.npmjs.com/package/@countrystatecity/translations) |
| `@countrystatecity/phonecodes` | [![](https://img.shields.io/npm/dm/@countrystatecity/phonecodes?label=phonecodes)](https://www.npmjs.com/package/@countrystatecity/phonecodes) | [![](https://img.shields.io/npm/dw/@countrystatecity/phonecodes?label=phonecodes%2Fweek)](https://www.npmjs.com/package/@countrystatecity/phonecodes) |
| `@countrystatecity/cli` | [![](https://img.shields.io/npm/dm/@countrystatecity/cli?label=cli)](https://www.npmjs.com/package/@countrystatecity/cli) | [![](https://img.shields.io/npm/dw/@countrystatecity/cli?label=cli%2Fweek)](https://www.npmjs.com/package/@countrystatecity/cli) |

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
