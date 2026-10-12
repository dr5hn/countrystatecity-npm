# Changelog

## 2.0.0

### Major Changes

Data now comes from upstream **v4.0-export.50**. The v3.2 → v4.0 transition removed 4,486 city ids (duplicates, US counties moved to a separate counties dataset, and non-places), reassigned 7,527 cities to different states, and added 27 states while retiring 6. Stored ids and per-state results can change; US counties are no longer returned as cities. Later export corrections are included in this snapshot.

Before upgrading stored city/state ids, use [`removed_ids_v3.2_to_v4.0.csv`](https://github.com/dr5hn/countries-states-cities-database/releases/download/v4.0/removed_ids_v3.2_to_v4.0.csv) attached to the [upstream v4.0 release](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v4.0). It identifies merged ids and their survivors, counties moved to new ids, and retired states and their successors. Match the `record`, `outcome`, and `new_table` columns before using `new_id`; a county id is not a city id. Refresh stored state associations against this snapshot.

City `type` uses standard terms (`municipality`, `city`, `town`, `village`, `locality`, `section`) for migrated countries; other countries can retain earlier terms such as `adm1`/`adm2`. This package intentionally projects a subset of upstream fields: `type_local`, `county_id`, `level`, and `parent_id` are omitted from city/state records, and no counties dataset is shipped. City translations remain empty objects; country translations are included. Use upstream exports when you need official local terms, county links, or hierarchy traversal.

Removed obsolete data files retained by previous CI artifact overlays; retired state files and duplicate city/postal records no longer remain beside the current snapshot.

## 1.0.9

### Patch Changes

- Updated data from countries-states-cities-database


## 1.0.8

### Patch Changes

- Updated data from countries-states-cities-database


## 1.0.7

### Patch Changes

- Fix repository and homepage URLs to point to monorepo

## 1.0.6

### Patch Changes

- Updated data from countries-states-cities-database


All notable changes to `@countrystatecity/countries` will be documented in this file.

## [1.0.5] - 2025-12-30

### Added
- Initial public release as standalone package (extracted from monorepo)
- 250+ countries, 5,000+ states, 150,000+ cities
- Lazy-loaded data with dynamic imports
- iOS/Safari compatibility (no stack overflow errors)
- Multi-path fallback for data loading (ESM, CJS, serverless)
- TypeScript types for all data models
- Utility functions: validation, search, timezone lookup
- Deployment guides for Vercel and Vite
- Automated weekly data updates from upstream database
- CI/CD with automated npm publishing

### Fixed
- Warn instead of silently returning null in browser environments
- Data download URL updated to use GitHub Releases

### Changed
- Auto-bump patch version on data updates for automatic publishing
- Standardized README structure across ecosystem
