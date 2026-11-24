# Changelog

All notable changes to this project will be documented in this file.

## 0.3.0 - 2026-11-24

### Added

- Country/state county lists, county detail and source-linked county cities, retaining every state membership.
- Exact-postcode lookup with all matches and cursor-paginated postcode search, without automatic extra requests.

### Changed

- City types now reflect string IDs, nullable state links, optional plan-gated fields, county IDs and population years. Consumers using numeric city IDs should compare `String(id)`.
- State-code validation accepts the API's 1–10 character codes and hyphens.

## 0.2.0 - 2026-08-29

### Added

- Autocomplete and nearby place search, with typed filters and results.
- Localized place names across geographic and search resources.
- The Business-plan data change feed through `csc.changes.list()`.

### Changed

- Upgrade links now point to the public pricing page.

## 0.1.0 - 2026-08-24

### Added

- Initial preview release of the official TypeScript and JavaScript client.
- Typed resources for live Country State City API data, search, and usage.
- ESM, CommonJS, Node.js, and browser support with structured API errors.
