# Changelog

## 1.0.6

### Patch Changes

- d3b5b54: Fix timezone convertTime returning incorrect originalTime and convertedTime in non-UTC environments. Migrate packages into unified monorepo with shared CI/CD pipeline, automated weekly data updates, and Changesets-based releases.

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
