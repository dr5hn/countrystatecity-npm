# CLAUDE.md

## Project Overview

**@countrystatecity/countries-browser** - A browser-native package providing lazy-loaded geographic data (countries, states, cities) via jsDelivr CDN with in-memory LRU caching.

**Critical Constraint**: This is a **browser-first** package. No Node.js dependencies (`fs`, `path`, `url`). All data loading uses the Fetch API.

## Development Commands

```bash
npm run build          # Build with tsup (ESM + CJS + types)
npm run dev            # Build in watch mode
npm run typecheck      # TypeScript type checking
npm test               # Run all tests with Vitest
npm run test:watch     # Tests in watch mode
npm run generate-data  # Transform server data into flat browser structure
```

## Architecture

### Data Loading Strategy

The package uses **fetch + jsDelivr CDN** with LRU in-memory caching:

1. Check LRU cache for requested data
2. On miss: `fetch()` from `cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@{VERSION}/dist/data/{path}`
3. Parse JSON, store in cache, return

### File Structure

```
src/
├── index.ts      # Public API re-exports
├── types.ts      # TypeScript interfaces (copied from server package)
├── errors.ts     # NetworkError, TimeoutError
├── config.ts     # Configuration management (baseURL, timeout, cacheSize)
├── cache.ts      # LRU cache implementation
├── fetcher.ts    # fetch wrapper with timeout and error handling
├── loaders.ts    # Core data loading functions
├── utils.ts      # Helper utilities (validation, search)
└── data/         # Flat JSON files (served by jsDelivr)
    ├── countries.json
    ├── country/{ISO2}.json
    ├── states/{ISO2}.json
    └── cities/{ISO2}-{STATE}.json
```

### Relationship to Server Package

This package mirrors the API of `@countrystatecity/countries` but replaces `fs.readFileSync` with `fetch()`. Types are copied (not imported) to avoid a dependency on a server-side package.

### Version Pinning

`__VERSION__` is replaced at build time by tsup's `define` option. CDN URLs include the exact package version for immutable caching.

### Data Generation

`scripts/generate-data.cjs` reads the server package's nested data structure and flattens it:
- `{CountryName-ISO2}/meta.json` -> `country/{ISO2}.json`
- `{CountryName-ISO2}/states.json` -> `states/{ISO2}.json`
- `{CountryName-ISO2}/{StateName-CODE}/cities.json` -> `cities/{ISO2}-{CODE}.json`

## Testing Strategy

- **Unit tests**: Mock `globalThis.fetch` with `vi.fn()`, test all code paths
- **Integration tests**: Mock fetch to read from local data files, verify real data

## Data Source

All data from: https://github.com/dr5hn/countries-states-cities-database
Data issues should be reported upstream.
