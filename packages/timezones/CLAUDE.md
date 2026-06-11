# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A timezone library with lazy-loading capabilities and iOS/Safari compatibility. Provides 392 IANA timezones organized by 223 countries with minimal bundle impact through dynamic imports.

**Key Design Principle**: Minimize bundle size by keeping timezone data external to the main bundle and loading it only when needed via dynamic imports.

## Development Commands

```bash
# Build
npm run build              # Build the package with tsup
npm run dev                # Build in watch mode

# Testing
npm test                   # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:ios           # Run iOS/Safari compatibility tests

# Code Quality
npm run lint               # Lint TypeScript files
npm run typecheck          # Type check without emitting

# Data Generation
npm run generate-data      # Generate timezone data from source file
```

## Architecture

### Core Structure

```
src/
├── index.ts          # Public API exports
├── loaders.ts        # Data loading functions (dynamic imports)
├── utils.ts          # Utility functions (time conversion, DST, etc.)
├── types.ts          # TypeScript interfaces
└── data/             # JSON data files (excluded from bundle)
    ├── timezones.json           # All timezones (~74KB)
    ├── abbreviations.json       # Timezone abbreviations (~5KB)
    └── by-country/              # Per-country timezone files
        └── {ISO2}.json          # ~0.3KB per country
```

### Data Loading Pattern

**Critical**: All data access MUST use dynamic imports to maintain lazy-loading benefits:

```typescript
// ✅ CORRECT - Dynamic import
export async function getTimezones(): Promise<ITimezone[]> {
  const { default: timezones } = await import('./data/timezones.json');
  return timezones;
}

// ❌ WRONG - Static import (bundles all data)
import timezones from './data/timezones.json';
```

All functions in `loaders.ts` use dynamic imports. All functions in `utils.ts` call loader functions (never import data directly).

### Build Process (tsup.config.ts)

1. **Bundle TypeScript code** - Bundles src/index.ts, loaders.ts, utils.ts, types.ts
2. **External data paths** - Marks `./data/*` as external (not bundled)
3. **Copy data files** - Copies `src/data/` to `dist/data/` in `onSuccess` hook
4. **Output formats** - Generates ESM (`.js`) and CJS (`.cjs`) with type definitions

This ensures data files remain separate and are only loaded when requested.

### iOS/Safari Compatibility

The package is designed to avoid stack overflow errors on iOS/Safari:

- Data files are kept small and split by country
- Dynamic imports prevent loading all data upfront
- Test suite includes iOS-specific compatibility tests (`tests/compatibility/ios-safari.test.ts`)
- Run `npm run test:ios` to verify iOS compatibility

### Data Generation

Timezone data is sourced from the [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database).

**Generate data from source**:
```bash
node scripts/generate-data.cjs <path-to-source-countries.json>
```

The script (`scripts/generate-data.cjs`):
1. Reads countries data with timezone information
2. Extracts and normalizes timezone data
3. Generates three outputs:
   - `timezones.json` - All timezones with dedupe
   - `abbreviations.json` - Timezone abbreviations with mappings
   - `by-country/{ISO2}.json` - Per-country timezone files

This process is automated via GitHub Actions (`.github/workflows/update-data.yml`) and runs weekly.

## Testing Strategy

### Test Organization

```
tests/
├── unit/                    # Unit tests for loaders and utils
│   ├── loaders.test.ts     # Data loading functions
│   └── utils.test.ts       # Utility functions
├── integration/             # API integration tests
│   └── api.test.ts         # End-to-end API testing
├── compatibility/           # Platform-specific tests
│   └── ios-safari.test.ts  # iOS/Safari compatibility
└── nextjs-integration/      # Next.js integration test app
```

### Running Specific Tests

```bash
# Run single test file
npx vitest run tests/unit/loaders.test.ts

# Run tests matching pattern
npx vitest run --grep "getTimezones"

# Run compatibility tests only
npm run test:ios
```

## Type System

All public functions return Promises due to dynamic imports. Core types:

```typescript
interface ITimezone {
  zoneName: string;        // "America/New_York"
  countryCode: string;     // "US"
  abbreviation: string;    // "EST"
  gmtOffset: number;       // -18000 (seconds)
  gmtOffsetName: string;   // "UTC-05:00"
  tzName: string;          // "Eastern Standard Time"
}
```

## DST Calculation Pattern

DST detection compares timezone offsets in January vs July to determine standard time:

```typescript
// Standard time is the maximum offset (most positive)
const standardOffset = Math.max(janOffset, julOffset);
// DST is active when current offset is less than standard offset
const isDST = nowOffset < standardOffset;
```

This pattern is used in both `getTimezoneInfo` (loaders.ts:44-58) and `isDaylightSaving` (utils.ts:61-78).

## Module System

- **Type**: ESM (`"type": "module"` in package.json)
- **Outputs**: Both ESM and CJS via tsup
- **Exports**: Dual exports in package.json for `.` and `./data/*`
- **TypeScript**: Target ES2020, moduleResolution "bundler"

## Contributing Workflow

When making changes:

1. **Modify source** in `src/`
2. **Update tests** if changing behavior
3. **Run type check**: `npm run typecheck`
4. **Run tests**: `npm test`
5. **Build**: `npm run build`
6. **Verify bundle size** - Check dist/ output sizes match expectations

Data changes should be submitted to the upstream [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database/issues).
