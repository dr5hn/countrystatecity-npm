# countrystatecity-npm

[![Pipeline](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)
[![License: ODbL-1.0](https://img.shields.io/badge/License-ODbL--1.0-blue.svg)](https://github.com/dr5hn/countrystatecity-npm/blob/main/LICENSE)

Monorepo for the `@countrystatecity` npm package ecosystem — countries, states, cities, timezones, currencies, and translations. All data is sourced from [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) and updated automatically every week.

---

## Packages

| Package | Description | Environment | Bundle |
|---|---|---|---|
| [`@countrystatecity/countries`](./packages/countries) | Countries, states, cities with lazy loading | Node.js / Server | <10KB |
| [`@countrystatecity/countries-browser`](./packages/countries-browser) | Same API as above, loads data via jsDelivr CDN | Browser / Any | <10KB |
| [`@countrystatecity/timezones`](./packages/timezones) | 392 IANA timezones with conversion utilities | Node.js / Server | <20KB |
| [`@countrystatecity/currencies`](./packages/currencies) | 155 ISO 4217 currencies with symbols & formatting | Node.js / Browser | <3KB |
| [`@countrystatecity/translations`](./packages/translations) | Country name translations in 19 languages | Node.js / Browser | <3KB |

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
│   └── translations/        # @countrystatecity/translations
├── scripts/
│   ├── fetch-database.cjs   # Downloads latest source JSON
│   └── generate-all.cjs     # Runs all package data generators
├── data/
│   └── source.json          # Raw source (git-ignored, fetched by CI)
├── .github/workflows/
│   ├── ci.yml               # Pipeline: fetch → generate → typecheck → build → test → PR
│   └── release.yml          # Release: changesets → publish to npm
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
npm test           # run tests
npm run build      # build
npm run typecheck  # type check
```

---

## CI/CD Pipeline

### On every push / pull request to `main`

```
typecheck → build → test
```

### Every Sunday at 00:00 UTC (or manual trigger)

```
fetch-data → generate-data → typecheck → build → test → open-pr
```

- **fetch-data**: Downloads the latest release from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database)
- **generate-data**: Splits the source JSON into per-package data files
- **open-pr**: Opens a "Automated Data Update" PR if data changed — you review and merge

### Release

After the pipeline passes on `main`, the release workflow runs automatically:

- If a [changeset](https://github.com/changesets/changesets) exists → creates/updates a "🚀 Release packages" PR with version bumps and changelogs
- If the Release PR is merged → publishes all changed packages to npm

To release a new version:

```bash
# 1. Describe your change
pnpm changeset

# 2. Commit and push
git add .changeset/
git commit -m "chore: add changeset"
git push

# 3. Merge the auto-created Release PR on GitHub → packages publish to npm
```

---

## Data Issues

All geographic data (country names, city coordinates, timezone offsets, etc.) comes from the upstream [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database). Report data issues there, not here.

---

## License

[ODbL-1.0](./LICENSE) © [dr5hn](https://github.com/dr5hn)

Data is licensed under the [Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/). You are free to share and adapt the data as long as you attribute the source, share adaptations under the same license, and keep the data open.
