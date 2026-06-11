# Changelog

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
