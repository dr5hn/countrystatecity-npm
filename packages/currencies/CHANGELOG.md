# @countrystatecity/currencies

## 2.0.1

### Changes

- Refresh country data and source attribution from pinned upstream v5.0.0-export.1.
- Include all upstream source notices in the published package.

## 2.0.0

### Major Changes

The v4.0-export.50 snapshot replaces currency codes `ANG` → `XCG`, `SLL` → `SLE`, and `ZWL` → `ZWG`. Lookups for the retired codes no longer return a currency. The Republic of the Congo (`CG`) maps to `XAF` instead of `CDF`. Refresh stored currency codes and country mappings before upgrading; these are code replacements, not an amount-conversion API.

This package does not contain city/state ids. If you combine it with geographic packages, the [upstream v4.0 release](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v4.0) documents removed geographic ids and provides [`removed_ids_v3.2_to_v4.0.csv`](https://github.com/dr5hn/countries-states-cities-database/releases/download/v4.0/removed_ids_v3.2_to_v4.0.csv) for migrating stored city/state ids.

## 1.0.5

### Patch Changes

- Updated data from countries-states-cities-database


## 1.0.4

### Patch Changes

- Updated data from countries-states-cities-database


## 1.0.3

### Patch Changes

- Fix repository and homepage URLs to point to monorepo


## 1.0.2

### Patch Changes

- Updated data from countries-states-cities-database

