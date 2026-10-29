# Changelog

## 2.0.1

### Changes

- Refresh country data and source attribution from pinned upstream v5.0.0-export.1.
- Include all upstream source notices in the published package.

## 2.0.0

### Major Changes

The v4.0-export.50 snapshot corrects timezone offsets and abbreviations. All 432 IANA zone records remain, but abbreviation lookups for `ACDT`, `AEDT`, `ALMT`, `EASST`, `EGT`, `MIST`, `MSD+1`, `NZDT`, `QYZST`, `QYZT`, and `WEST` now return no matches. Abbreviations `CLT`, `EAST`, `KZT`, and `NZST` were added. Persist IANA zone names and refresh abbreviation/offset metadata before upgrading.

This package does not contain city/state ids. If you combine it with geographic packages, the [upstream v4.0 release](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v4.0) documents removed geographic ids and provides [`removed_ids_v3.2_to_v4.0.csv`](https://github.com/dr5hn/countries-states-cities-database/releases/download/v4.0/removed_ids_v3.2_to_v4.0.csv) for migrating stored city/state ids.

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


All notable changes to `@countrystatecity/timezones` will be documented in this file.

## [1.0.5] - 2025-12-21

### Added
- Initial public release as standalone package (extracted from monorepo)
- 392 IANA timezones across 223 countries
- Time conversion between timezones
- Current time lookup by timezone
- DST (Daylight Saving Time) detection
- Timezone search by name, abbreviation, and offset
- Lazy-loaded data organized by country
- iOS/Safari compatibility
- TypeScript types for all data models
- Automated weekly data updates from upstream database
- CI/CD with automated npm publishing

### Fixed
- Improved DST calculation in getTimezoneInfo function
- Data download URL updated to use GitHub Releases
- Removed leftover vite integration test from monorepo

### Changed
- Auto-bump patch version on data updates for automatic publishing
- Standardized README structure across ecosystem
