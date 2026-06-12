# @countrystatecity/cli - Implementation Plan

**Date:** 28 March 2026
**Status:** Ready for implementation
**Target:** Hand off to Claude Code for autonomous build
**Repo:** New standalone repo `csc-cli`

---

## Overview

Build a CLI tool that wraps the Country State City API (api.countrystatecity.in). The CLI is both a developer utility and a conversion funnel - every command hits the live API, counts toward quota, and shows usage stats to nudge upgrades.

**Package:** `@countrystatecity/cli`
**Binary name:** `csc`
**Stack:** Node.js + TypeScript (ES2020 target)
**Data source:** API-only (https://api.countrystatecity.in/v1)
**Auth:** API key stored in `~/.config/csc/config.json`

---

## Phase 1 - MVP Commands

Build these commands in this order. Each must be fully working before moving to the next.

### 1. Project Scaffolding

Create the project with this structure:

```
csc-cli/
  src/
    commands/
      auth.ts
      search.ts
      get.ts
      usage.ts
      upgrade.ts
      generate.ts
    lib/
      api.ts
      config.ts
      display.ts
      usage-footer.ts
    templates/
      react-dropdown.ts
      prisma-seed.ts
    index.ts
  tests/
    commands/
      auth.test.ts
      search.test.ts
      get.test.ts
      usage.test.ts
      generate.test.ts
    lib/
      api.test.ts
      config.test.ts
  package.json
  tsconfig.json
  README.md
  LICENSE
  .gitignore
  CLAUDE.md
```

**package.json essentials:**

```json
{
  "name": "@countrystatecity/cli",
  "version": "0.1.0",
  "description": "Official CLI for the Country State City API - search, explore, and generate code from geographic data",
  "bin": {
    "csc": "./dist/index.js"
  },
  "type": "module",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsx src/index.ts",
    "test": "vitest",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "country", "state", "city", "geography", "cli",
    "country-state-city", "geolocation", "iso",
    "dropdown", "seed", "code-generator"
  ],
  "author": "dr5hn",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dr5hn/csc-cli.git"
  }
}
```

**Dependencies:**

```json
{
  "dependencies": {
    "commander": "^13.0.0",
    "chalk": "^5.4.0",
    "ora": "^8.0.0",
    "conf": "^13.0.0",
    "open": "^10.0.0",
    "axios": "^1.7.0",
    "cli-table3": "^0.6.5"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "vitest": "^3.0.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0"
  }
}
```

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 2. Core Library Files

#### `src/lib/config.ts` - Configuration Management

Store config at `~/.config/csc/config.json` using the `conf` package.

**Stored values:**
- `apiKey` (string) - The user's API key
- `apiBase` (string, default: `https://api.countrystatecity.in/v1`) - API base URL

**Functions:**
- `getApiKey(): string | undefined`
- `setApiKey(key: string): void`
- `clearApiKey(): void`
- `getApiBase(): string`
- `isAuthenticated(): boolean`

#### `src/lib/api.ts` - API Client

Axios-based client that:
- Reads API key from config
- Sets `X-CSCAPI-KEY` header on all requests
- Sets `User-Agent: @countrystatecity/cli/<version>` header
- Handles errors consistently (401 -> "Invalid API key. Run `csc auth login`", 429 -> show upgrade message, 404 -> "Not found", network errors -> "Cannot reach API")
- Returns parsed response data
- Captures response headers for usage display (`X-CSC-Daily-Used`, `X-CSC-Daily-Limit`, `X-CSC-Monthly-Used`, `X-CSC-Monthly-Limit`)

**Functions:**
- `get<T>(path: string): Promise<{ data: T, usage: UsageInfo | null }>`

**Types:**
```typescript
interface UsageInfo {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}
```

**Error handling pattern:**
```typescript
if (status === 401) {
  console.error(chalk.red('Invalid or missing API key.'));
  console.error(chalk.dim('Run `csc auth login` to set your key.'));
  process.exit(1);
}
if (status === 429) {
  console.error(chalk.red('Daily limit reached.'));
  console.error(chalk.yellow('Run `csc upgrade` to increase your limits.'));
  process.exit(1);
}
```

#### `src/lib/display.ts` - Output Formatting

**Functions:**
- `printTable(headers: string[], rows: string[][]): void` - Uses cli-table3 for clean tabular output
- `printJson(data: unknown): void` - Pretty-printed JSON with chalk syntax highlighting
- `printDetail(label: string, value: string): void` - Key-value pair display

#### `src/lib/usage-footer.ts` - Usage Display After Every Command

**CRITICAL: This is the conversion mechanic. Show after EVERY command that hits the API.**

```typescript
function printUsageFooter(usage: UsageInfo | null): void
```

**Behaviour:**
- If usage headers not present, show nothing (graceful degradation)
- Normal (under 80%): dim grey text
  ```
  Usage: 47/100 today | 1,230/3,000 this month (Community)
  ```
- Warning (80-99%): yellow text
  ```
  Warning: 82/100 daily requests used (82%). Upgrade for more at $5/mo.
  Run `csc upgrade` to view plans.
  ```
- At limit (100%): red text
  ```
  Daily limit reached (100/100). Resets in 4h 23m.
  Upgrade to Starter ($5/mo) for 300 requests/day.
  Run `csc upgrade` or visit https://app.countrystatecity.in/pricing
  ```

The tier name display should be inferred from the daily limit:
- 100 -> Community
- 300 -> Starter
- 1,000 -> Supporter
- 3,300 -> Professional
- 25,000 -> Business
- 50,000+ -> Legacy/Custom

### 3. Commands

#### `csc auth login`

**Flow:**
1. Prompt user: "Enter your API key (get one at https://app.countrystatecity.in):"
2. Read input from stdin (masked with asterisks)
3. Validate by calling `GET /countries/IN` with the key
4. If valid: save to config, print success with green tick
5. If invalid: print error, do not save

**Alternative flow (flag):**
- `csc auth login --key <API_KEY>` - Skip prompt, use provided key directly

**Output on success:**
```
API key saved successfully.
Tier: Supporter | 1,000/day | 30,000/month
```

#### `csc auth status`

**Flow:**
1. Check if API key exists in config
2. If not: print "Not logged in. Run `csc auth login`"
3. If yes: call `GET /countries/IN` to validate and get usage headers
4. Display: key (masked, show last 4 chars), tier, daily/monthly usage

**Output:**
```
Authenticated
Key:    ****...a1b2
Tier:   Supporter
Daily:  47 / 1,000
Monthly: 1,230 / 30,000
```

#### `csc auth logout`

**Flow:**
1. Clear API key from config
2. Print confirmation

#### `csc search countries`

**Endpoint:** `GET /countries`
**Output:** Table with columns: ISO2, ISO3, Name, Capital, Phone Code, Currency
**Flags:**
- `--json` - Output raw JSON instead of table
- `--filter <text>` - Client-side filter by name (case-insensitive contains)

**Show usage footer after output.**

#### `csc search states --country <ISO2>`

**Endpoint:** `GET /countries/{iso2}/states`
**Required flag:** `--country` or `-c` (ISO2 code)
**Output:** Table with columns: ID, Name, ISO2, Type
**Flags:**
- `--json` - Output raw JSON
- `--filter <text>` - Client-side filter by name

**If --country not provided:** Print error "Country code required. Use --country IN"
**Show usage footer after output.**

#### `csc search cities --country <ISO2> --state <ISO2>`

**Endpoint:** `GET /countries/{country_iso2}/states/{state_iso2}/cities`
**Required flags:** `--country` or `-c`, `--state` or `-s`
**Output:** Table with columns: ID, Name
**Flags:**
- `--json` - Output raw JSON
- `--filter <text>` - Client-side filter by name

**If --country and --state not both provided:** Print error with example usage
**Show usage footer after output.**

#### `csc search <query>` (Global Search)

**Flow:**
1. Fetch all countries (`GET /countries`)
2. Filter client-side by name matching the query (case-insensitive contains)
3. Display matching countries in table format
4. Print hint: "Tip: Use `csc search states --country IN` to search within a country"

This is intentionally simple for MVP. Server-side search is a future premium feature.

**Show usage footer after output.**

#### `csc get country <ISO2>`

**Endpoint:** `GET /countries/{iso2}`
**Output:** Detailed key-value display:
```
Country: India
ISO2: IN
ISO3: IND
Capital: New Delhi
Phone Code: +91
Currency: INR (Indian rupee) Rs
Region: Asia > Southern Asia
Coordinates: 20.0000, 77.0000
TLD: .in
Native Name: (native name)
Flag: (emoji)
Timezones: Asia/Kolkata (IST, UTC+05:30)
```

**Flags:**
- `--json` - Output raw JSON

Parse the `timezones` and `translations` JSON strings for display.
**Show usage footer after output.**

#### `csc get state <country_iso2> <state_iso2>`

**Endpoint:** `GET /countries/{country_iso2}/states/{state_iso2}`
**Output:** Key-value display with all available fields
**Flags:**
- `--json` - Output raw JSON

**Show usage footer after output.**

#### `csc usage`

**Flow:**
1. Call `GET /countries/IN` (lightweight call just to get usage headers)
2. Display usage information prominently

**Output:**
```
Plan:     Supporter ($9/mo)
Daily:    [========--] 47 / 1,000 (4.7%)
Monthly:  [==========----------] 1,230 / 30,000 (4.1%)
Resets:   Daily in 4h 23m | Monthly in 12 days
```

The progress bar should be coloured:
- Green: 0-60%
- Yellow: 60-80%
- Red: 80-100%

#### `csc upgrade`

**Flow:**
1. Print current tier info (if authenticated)
2. Print tier comparison table
3. Open `https://app.countrystatecity.in/pricing` in browser using `open` package

**Output:**
```
Current plan: Community (Free)

Available plans:
Starter       $5/mo    300/day      9,000/month
Supporter     $9/mo    1,000/day    30,000/month
Professional  $29/mo   3,300/day    100,000/month
Business      $79/mo   25,000/day   750,000/month

Opening pricing page...
```

#### `csc generate dropdown`

**THIS IS THE KEY DIFFERENTIATOR. Build it well.**

**Subcommand:** `csc generate dropdown`
**Required flags:**
- `--entity` or `-e`: `countries` | `states` | `cities`
- `--format` or `-f`: `react` (MVP, add `vue` and `vanilla` in Phase 2)

**Optional flags:**
- `--country` or `-c`: Required when entity is `states` or `cities`
- `--state` or `-s`: Required when entity is `cities`
- `--output` or `-o`: Output directory (default: current directory)
- `--typescript`: Generate .tsx (default) vs .jsx

**Tier gating:** Community tier users get a friendly message:
```
The generate command requires a Supporter plan or above ($9/mo).
Your current plan: Community (Free)

Run `csc upgrade` to unlock code generation.
```

To check tier: inspect the daily limit from usage headers. If dailyLimit <= 100, it's Community tier. If dailyLimit <= 300, it's Starter tier.

**Flow:**
1. Check auth
2. Check tier (Supporter+ required)
3. Fetch data from API (e.g., all countries for a countries dropdown)
4. Apply template with fetched data
5. Write file to --output directory
6. Print success with file path

**React dropdown template (`src/templates/react-dropdown.ts`):**

Generate a self-contained React component. The template function receives the fetched data and returns a string of TypeScript/React code.

**Example output for `csc generate dropdown --entity countries --format react`:**

```tsx
// CountrySelect.tsx
// Generated by @countrystatecity/cli
// Data: 250 countries from countrystatecity.in

import { useState } from 'react';

interface Country {
  id: number;
  name: string;
  iso2: string;
  phonecode: string;
  emoji: string;
}

const countries: Country[] = [
  { id: 101, name: "India", iso2: "IN", phonecode: "91", emoji: "🇮🇳" },
  // ... all countries embedded
];

interface CountrySelectProps {
  value?: string;
  onChange?: (iso2: string, country: Country) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select a country",
  className = "",
  disabled = false,
}: CountrySelectProps) {
  const [selected, setSelected] = useState(value || "");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iso2 = e.target.value;
    setSelected(iso2);
    const country = countries.find(c => c.iso2 === iso2);
    if (onChange && country) onChange(iso2, country);
  };

  return (
    <select
      value={selected}
      onChange={handleChange}
      className={className}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {countries.map((c) => (
        <option key={c.iso2} value={c.iso2}>
          {c.emoji} {c.name}
        </option>
      ))}
    </select>
  );
}
```

**For states:** Generate `StateSelect.tsx` with a `countryCode` prop that filters states.
**For cities:** Generate `CitySelect.tsx` with `countryCode` and `stateCode` props.

#### `csc generate seed`

**Subcommand:** `csc generate seed`
**Required flags:**
- `--entity` or `-e`: `countries` | `states` | `cities`
- `--format` or `-f`: `prisma` (MVP, add `laravel` and `drizzle` in Phase 2)

**Optional flags:**
- `--country` or `-c`: Filter by country
- `--state` or `-s`: Filter by state (for cities)
- `--output` or `-o`: Output directory

**Tier gating:** Same as dropdown - Supporter+ required.

**Prisma seed template:**

Generate a TypeScript file that uses `prisma.country.createMany()` (or state/city) with the fetched data embedded.

**Example output for `csc generate seed --entity countries --format prisma`:**

```typescript
// seed-countries.ts
// Generated by @countrystatecity/cli
// Data: 250 countries from countrystatecity.in

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const countries = [
  { name: "India", iso2: "IN", iso3: "IND", phonecode: "91", capital: "New Delhi", currency: "INR" },
  // ... all countries
];

async function main() {
  console.log(`Seeding ${countries.length} countries...`);
  await prisma.country.createMany({
    data: countries,
    skipDuplicates: true,
  });
  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 4. Entry Point

#### `src/index.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerSearchCommands } from './commands/search.js';
import { registerGetCommands } from './commands/get.js';
import { registerUsageCommand } from './commands/usage.js';
import { registerUpgradeCommand } from './commands/upgrade.js';
import { registerGenerateCommands } from './commands/generate.js';

const program = new Command();

program
  .name('csc')
  .description('Official CLI for the Country State City API')
  .version('0.1.0');

registerAuthCommands(program);
registerSearchCommands(program);
registerGetCommands(program);
registerUsageCommand(program);
registerUpgradeCommand(program);
registerGenerateCommands(program);

program.parse();
```

### 5. CLAUDE.md for the repo

Create a `CLAUDE.md` in the repo root with:

```markdown
# CSC CLI - Development Guide

## Quick Start
npm install
npm run dev -- auth login
npm run dev -- search countries
npm run build

## Architecture
- Entry: src/index.ts (commander setup)
- Commands: src/commands/*.ts (one file per command group)
- Core: src/lib/api.ts (API client), config.ts (conf storage), display.ts (formatting)
- Templates: src/templates/*.ts (code generation templates)

## Key Design Rules
1. EVERY command that calls the API MUST show the usage footer via printUsageFooter()
2. The `generate` command is tier-gated (Supporter+). Check dailyLimit from usage headers.
3. All API calls go through src/lib/api.ts - never call axios directly from commands
4. --json flag on all search/get commands outputs raw JSON (for piping)
5. Error messages must always suggest the next action (e.g., "Run `csc auth login`")

## API
- Base: https://api.countrystatecity.in/v1
- Auth header: X-CSCAPI-KEY
- Usage headers: X-CSC-Daily-Used, X-CSC-Daily-Limit, X-CSC-Monthly-Used, X-CSC-Monthly-Limit

## Testing
npm test (vitest)
Mock API calls in tests - do not hit the live API.

## Build & Publish
npm run build (tsup -> dist/)
npm publish --access public
```

---

## Phase 2 - Export + Polish (after Phase 1 ships)

### Additional Commands

#### `csc export`

**Subcommand:** `csc export <entity>`
**Entity:** `countries` | `states` | `cities`
**Required flags:**
- `--format` or `-f`: `json` | `csv` | `sql`

**Optional flags:**
- `--country` or `-c`: Filter by country
- `--state` or `-s`: Filter by state
- `--output` or `-o`: Output file path (default: stdout)

**Tier gating:** Supporter+ required (same as generate).

**Flow:**
1. Fetch data from API
2. Transform to requested format
3. Write to file or stdout

**CSV format:** Use comma-separated with header row.
**SQL format:** Generate INSERT statements for MySQL-compatible syntax.
**JSON format:** Pretty-printed array.

### Additional Generate Templates

- `--format vue` for generate dropdown (Vue 3 SFC component)
- `--format vanilla` for generate dropdown (plain HTML/JS)
- `--format laravel` for generate seed (Laravel migration + seeder)
- `--format drizzle` for generate seed (Drizzle ORM insert)

### Polish Items

- Tab completion script (`csc completion`)
- `--no-footer` global flag to suppress usage footer
- `--quiet` or `-q` global flag for minimal output (scripting mode)
- Coloured help text
- npm publish with provenance

---

## Testing Strategy

### Unit Tests (vitest)

**Mock the API client** - never hit the live API in tests.

**Test each command:**
- `auth login` - test valid key saves, invalid key rejects, masked input
- `auth status` - test authenticated vs unauthenticated display
- `search countries` - test table output, --json flag, --filter flag
- `search states` - test required --country flag validation
- `search cities` - test required --country and --state validation
- `get country` - test detail display, JSON string parsing (timezones, translations)
- `usage` - test progress bar rendering at various percentages
- `generate dropdown` - test tier gating, file output, template correctness
- `generate seed` - test tier gating, file output, template correctness

**Test the usage footer:**
- Under 80%: dim grey output
- 80-99%: yellow warning
- At 100%: red error with upgrade message
- Missing headers: no output (graceful degradation)

**Test the API client:**
- 401 handling
- 429 handling
- 404 handling
- Network error handling
- Usage header extraction

### Manual Testing Checklist

Before npm publish:
- [ ] `npm install -g .` works
- [ ] `csc --help` shows all commands
- [ ] `csc --version` shows correct version
- [ ] `csc auth login` flow works end-to-end
- [ ] `csc search countries` returns 250 countries
- [ ] `csc search states --country IN` returns Indian states
- [ ] `csc search cities --country IN --state MH` returns Maharashtra cities
- [ ] `csc get country IN` shows full detail with parsed timezones
- [ ] `csc usage` shows progress bars
- [ ] `csc upgrade` opens browser
- [ ] `csc generate dropdown --entity countries --format react` produces valid .tsx
- [ ] `csc generate seed --entity countries --format prisma` produces valid .ts
- [ ] `--json` flag works on all search/get commands
- [ ] Usage footer appears after every API command
- [ ] 429 error shows upgrade message
- [ ] Running without auth shows helpful error

---

## README.md Content

The README should include:

1. **Hero section** - Package name, one-line description, install command
2. **Quick start** - Install, login, first search (3 commands)
3. **All commands** with examples (copy-paste ready)
4. **Generate examples** - Show the dropdown and seed output
5. **Tier info** - Which commands are free vs paid
6. **Links** - API docs, dashboard, pricing

---

## Implementation Notes

- Use ESM throughout (type: module in package.json)
- tsup for building (single file output, tree-shaking)
- The `#!/usr/bin/env node` shebang is critical for the bin entry - only on src/index.ts, not on generated template files
- Test with `npm link` locally before publishing
- The API may not yet return usage headers (X-CSC-Daily-Used etc.) - if ANY of the four headers are missing, show no usage footer at all (complete graceful degradation)
- The timezones and translations fields from the API are JSON strings, not objects - parse them with try/catch, fall back to showing raw string if malformed
- Country detail endpoint returns coordinates as strings ("20.00000000") - format to 4 decimal places for display

## Clarifications for Autonomous Build

### Input Masking
For `csc auth login` prompt, use Node.js built-in `readline` with `createInterface` and set `output` to a custom stream that masks characters. Do NOT add a dependency for this. Alternatively, accept `--key <KEY>` flag to skip the prompt entirely.

### Reset Time Calculation
The usage footer "Resets in X hours" should estimate by assuming:
- Daily limit resets at 00:00 UTC
- Monthly limit resets on the 1st at 00:00 UTC
- Calculate: `const msUntilReset = new Date().setUTCHours(24,0,0,0) - Date.now()`
- If calculation is unreliable, simply omit the reset time from output

### Progress Bar Width
Use 20 character width for all progress bars: `[==========----------]` style.
Formula: `Math.round((used / limit) * 20)` filled chars, remainder as dashes.

### Output Directory for Generate
The `--output` flag default is the current working directory (process.cwd()).
File is written directly to cwd or specified directory, not into any subdirectory.
Create the directory if it does not exist (recursive mkdir).

### No Pagination Needed
All search results (250 countries, ~40 states per country, etc.) fit in memory. No pagination needed for MVP. Just display all results in the table.
