# Changelog

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
