# Changelog

## 3.0.0

### Breaking changes

- Ship upstream v5.0.0-export.1. Retired state, city, and postcode IDs must be reviewed with upstream migration files; do not redirect IDs automatically.
- Cities may have null state links. Country-wide city lookups include these cities; pass null to state-based city lookups to select them.
- Preserve source notices with redistributed data.

## 2.0.0

### Major Changes

Data now comes from upstream **v4.0-export.50**. The v3.2 → v4.0 transition removed 4,486 city ids (duplicates, US counties moved to a separate counties dataset, and non-places), reassigned 7,527 cities to different states, and added 27 states while retiring 6. Stored ids and per-state results can change; US counties are no longer returned as cities. Later export corrections are included in this snapshot.

Before upgrading stored city/state ids, use [`removed_ids_v3.2_to_v4.0.csv`](https://github.com/dr5hn/countries-states-cities-database/releases/download/v4.0/removed_ids_v3.2_to_v4.0.csv) attached to the [upstream v4.0 release](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v4.0). It identifies merged ids and their survivors, counties moved to new ids, and retired states and their successors. Match the `record`, `outcome`, and `new_table` columns before using `new_id`; a county id is not a city id. Refresh stored state associations against this snapshot.

City `type` uses standard terms (`municipality`, `city`, `town`, `village`, `locality`, `section`) for migrated countries; other countries can retain earlier terms such as `adm1`/`adm2`. This package intentionally projects a subset of upstream fields: `type_local`, `county_id`, `level`, and `parent_id` are omitted from city/state records, and no counties dataset is shipped. City translations remain empty objects; country translations are included. Use upstream exports when you need official local terms, county links, or hierarchy traversal.

Removed obsolete data files retained by previous CI artifact overlays; retired state files and duplicate city/postal records no longer remain beside the current snapshot.

## 1.0.4

### Patch Changes

- Updated data from countries-states-cities-database


## 1.0.3

### Patch Changes

- Updated data from countries-states-cities-database


## 1.0.2

### Patch Changes

- Fix repository and homepage URLs to point to monorepo


## 1.0.1

### Patch Changes

- Updated data from countries-states-cities-database


All notable changes to `@countrystatecity/countries-browser` will be documented in this file.

## [1.0.0] - 2026-03-28

### Added
- Initial release — browser-native alternative to `@countrystatecity/countries`
- Same API as server package (8 data functions + 7 utility functions)
- fetch + jsDelivr CDN for data loading (no Node.js dependencies)
- LRU in-memory cache with configurable size
- Configurable CDN base URL for self-hosting
- Custom error classes: NetworkError, TimeoutError
- Flat CDN-friendly data structure (ISO-code paths)
- 250+ countries, 5,000+ states, 150,000+ cities
- Data generation script to transform server package data
- 68 tests (unit + integration)
- TypeScript types (copied from server package for independence)
- CI/CD with automated npm publishing
- Automated weekly data updates from upstream database
