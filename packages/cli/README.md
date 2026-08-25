# @countrystatecity/cli

[![npm](https://img.shields.io/npm/v/@countrystatecity/cli)](https://www.npmjs.com/package/@countrystatecity/cli)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/@countrystatecity/cli?label=cli)](https://www.npmjs.com/package/@countrystatecity/cli)
[![npm downloads](https://img.shields.io/npm/dw/@countrystatecity/cli?label=cli)](https://www.npmjs.com/package/@countrystatecity/cli)

Official CLI for the [Country State City API](https://countrystatecity.in) — search, explore, and generate code from geographic data.

```bash
npm install -g @countrystatecity/cli
```

## Quick Start

```bash
# 1. Get your free API key at https://app.countrystatecity.in?source=npm&campaign=sdk_api_migration&package=cli
csc auth login

# 2. Search countries
csc search countries

# 3. Get country details
csc get country IN
```

## Local package or live API?

This CLI always talks to the live CountryStateCity API — there's no local/offline mode to choose here. If you're building your *own* app on top of the same data, you have two options:

- **Offline/bundled**: [`@countrystatecity/countries`](https://www.npmjs.com/package/@countrystatecity/countries) (Node) or [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser) (browser) — a free snapshot, no API key, no network call.
- **Live, in code**: `@countrystatecity/sdk` — the same API this CLI uses, with a typed client, fuzzy search, and account usage.

**Start free with 3,000 requests per month.** [Compare plans](https://countrystatecity.in/pricing?source=npm&campaign=sdk_api_migration&package=cli) or [get an API key](https://app.countrystatecity.in?source=npm&campaign=sdk_api_migration&package=cli).

```bash
npm install @countrystatecity/sdk
```

```typescript
// What `csc search countries` does under the hood
import { createCSCClient } from '@countrystatecity/sdk';

const csc = createCSCClient({ apiKey: process.env.CSC_API_KEY! });
const { data: countries } = await csc.countries.list();
```

See the [full migration guide](https://github.com/dr5hn/countrystatecity-npm/blob/main/packages/sdk/MIGRATION.md) for error handling, retries, and more.

## Global Flags

These flags work on every command:

| Flag | Short | Description |
|------|-------|-------------|
| `--json` | | Output raw JSON instead of formatted tables |
| `--quiet` | `-q` | Suppress all decorative output (spinners, tips) |
| `--no-footer` | | Hide the API usage footer after each command |

## Commands

### Authentication

```bash
csc auth login                # Interactive login with API key
csc auth login --key <KEY>    # Login with key directly
csc auth status               # Check current auth status
csc auth status --json        # Returns { authenticated, key, tier, daily, monthly }
csc auth logout               # Remove stored API key
csc auth logout --json        # Returns { success: true }
```

### Search

```bash
# List all countries
csc search countries
csc search countries --filter "united"
csc search countries --json

# List all states globally
csc search states

# List states for a country
csc search states --country IN
csc search states -c US --filter "new"

# List all cities for a country
csc search cities --country IN

# List cities for a specific state
csc search cities --country IN --state MH
csc search cities -c US -s CA --json

# List all world regions (requires Starter plan+)
csc search regions
csc search regions --filter "asia"

# Global search (matches country names)
csc search india
```

### Nearby Search

Find countries, states, or cities near a coordinate, nearest first. Requires a Professional or Business API plan.

```bash
csc nearby --lat 19.076 --lng 72.878 --radius 25
csc nearby --lat 19.076 --lng 72.878 --kind settlement
csc nearby --lat 19.076 --lng 72.878 --type state
csc nearby --lat 19.076 --lng 72.878 --country IN --min-population 100000
csc nearby --lat 19.076 --lng 72.878 --json

# Options
--type <type>            # country, state, or city (default: city)
--kind <kind>            # city only: settlement, administrative, section, unknown
--country <iso2>         # Filter by country (invalid when --type=country)
--state <iso2>           # Filter by state (requires --country)
--min-population <n>     # Minimum population
--radius <km>            # Search radius, 1-500 (default: 25)
--limit <n>               # Result limit, 1-100 (default: 20)
```

Results include a `Distance (km)` column, ordered nearest-first.

[Compare Professional and Business plans](https://countrystatecity.in/pricing?source=cli_docs&campaign=nearby_search&package=cli).

### Get Details

```bash
# Detailed country info (timezones, coordinates, currency, etc.)
csc get country IN
csc get country US --json
csc get country           # Interactive — prompts to pick a country (TTY only)

# Detailed state info
csc get state IN MH
csc get state IN MH --json
csc get state             # Interactive — prompts for country then state (TTY only)
```

### Usage & Billing

```bash
# View API usage with progress bars
csc usage
csc usage --json          # Returns { plan, price, daily, monthly }

# View plans and open pricing page
csc upgrade
csc upgrade --json        # Returns { plans, currentPlan }
```

### Code Generation

Generate ready-to-use components and seed files from live API data.

> Requires Supporter plan or above ($9/mo). Run `csc upgrade` to view plans.

```bash
# Generate a React dropdown component
csc generate dropdown --entity countries --format react
csc generate dropdown -e states -f react --country IN
csc generate dropdown -e cities -f react -c IN -s MH

# Generate a Prisma seed file
csc generate seed --entity countries --format prisma
csc generate seed -e states -f prisma --country IN
csc generate seed -e cities -f prisma -c IN -s MH

# Options (apply to both dropdown and seed)
--output <dir>     # Output directory (default: current directory)
--no-typescript    # Generate .jsx instead of .tsx  (dropdown only)
```

#### Example: Generated Country Dropdown

```tsx
// CountrySelect.tsx — generated by csc
import { useState } from 'react';

const countries = [
  { id: 101, name: "India", iso2: "IN", phonecode: "91", emoji: "🇮🇳" },
  // ... 250 countries embedded
];

export default function CountrySelect({ value, onChange, placeholder, className, disabled }) {
  // Full select component with onChange handler
}
```

#### Example: Generated Prisma Seed

```typescript
// seed-countries.ts — generated by csc
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const countries = [
  { name: "India", iso2: "IN", iso3: "IND", phonecode: "91", capital: "New Delhi", currency: "INR" },
  // ... 250 countries
];

async function main() {
  await prisma.country.createMany({ data: countries, skipDuplicates: true });
}
```

### Live Location Components

Unlike `dropdown`/`seed` above, these generate *live, interactive* components that call the real autocomplete API as the user types — nothing is pre-fetched or baked in, so no plan check or network access is needed to run the generator itself.

The generated components require a **Professional or Business API plan** at runtime. [Compare plans](https://countrystatecity.in/pricing?source=cli&campaign=location_components&package=cli).

```bash
# Type-ahead search field
csc generate autocomplete --target nextjs         # server API route + client component (recommended)
csc generate autocomplete --target react-browser  # calls the API directly from the browser

# Cascading country → state → city picker
csc generate location-picker --target nextjs
csc generate location-picker --target react-browser

# Options
--output <dir>     # Output directory (default: current directory)
```

The `nextjs` target keeps your API key server-side behind a generated Route Handler; the `react-browser` target has no server, so the key ships to the browser — the CLI prints a warning (repeated in the generated README) that the key must be restricted to your site's origin(s) in the CSC dashboard before using it. Both targets debounce input (~250ms), require at least 2 characters, cancel stale in-flight requests, surface distinct loading/empty/plan-restricted/rate-limit/network-error states, and implement the ARIA combobox pattern with full keyboard support.

### Interactive Explorer

```bash
# Launch an interactive browser: pick a country, then a state, then an action
csc explore
```

From the action menu you can:
- View all cities for the selected state
- View full country or state details
- Get the equivalent `csc generate` command to copy-paste

> Requires an interactive terminal (TTY). Use `csc search` for scripts.

### Export

```bash
# Open the online bulk export tool in your browser
csc export

# Get the export URL as JSON (useful for scripts)
csc export --json
```

## Tiers

| Feature | Community (Free) | Starter ($5/mo) | Supporter ($9/mo) | Professional ($29/mo) | Business ($79/mo) |
|---------|------------------|-----------------|-------------------|----------------------|-------------------|
| Search & Get | Yes | Yes | Yes | Yes | Yes |
| Daily requests | 100 | 300 | 1,000 | 3,300 | 25,000 |
| Monthly requests | 3,000 | 9,000 | 30,000 | 100,000 | 750,000 |
| Code generation | No | No | Yes | Yes | Yes |

## Links

- [API Documentation](https://countrystatecity.in/docs/)
- [Dashboard](https://app.countrystatecity.in?source=npm&campaign=sdk_api_migration&package=cli)
- [Pricing](https://countrystatecity.in/pricing?source=npm&campaign=sdk_api_migration&package=cli)
- [GitHub (monorepo)](https://github.com/dr5hn/countrystatecity-npm/tree/main/packages/cli)

## License

MIT
