# Updating packages to upstream v5 data

This update targets the exact snapshot `v5.2.0-export.1`. The live API clients
still use the API's data version; this update does not change the API or SDK.

## Moving from a package older than 3.0.0

Version 3.0.0 of `countries`, `countries-browser`, `geojson`, and `postalcodes`
introduced v5 data because upstream removed or repaired stored IDs and allowed
cities without a state. These migration rules still apply:

- Back up stored IDs before updating. Follow the upstream
  [v5 migration instructions](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v5.0.0).
  Do not automatically turn a removed administrative unit into its seat town.
- City `state_id` and `state_code` can be null. Country-wide city loaders include
  these rows. Use `getCitiesOfState('EH', null)`, `getCityById('EH', null, 67220)`,
  or `getCitiesGeoJSON('EH', null)` to select cities with no state.
- Population reference years are available as `population_year`. A population
  without a year remains null for that field.
- Keep the package's `NOTICE-*.txt` files with redistributed data. They are copied
  from the same pinned export and verified against GitHub's asset checksums.
- These packages still project only their documented fields. They do not expose
  counties, county-region relations, city hierarchy levels, or local type labels.

## November update

The v5.1.0 export was published on 2 November, after the date-limited 1 November
automation. Its release gate correctly held the old snapshot instead of
publishing it as the new export. This update uses the newer published
[v5.2.0-export.1](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v5.2.0-export.1),
released on 3 November.

- 250 countries, 5,327 states, 156,169 cities, and 728,556 postal records.
- Compared with the previous npm snapshot: 3,791 additional cities, with no city
  IDs removed, and 2,563 additional postal records. Postal data covers 117 countries.
- All three cities without a state remain available.
- The existing state `fips_code` field now preserves all 4,633 available values,
  including leading zeroes. Missing values remain null. The full state source is
  fetched from the export tag's exact Git commit, verified against its Git blob
  checksum, and recorded in the data manifest with its SHA-256 checksum.
- Some added city records are municipalities or other administrative areas, not
  settlement-only choices. Keep the original `type`; do not add a municipality's
  population to the populations of its towns.
- The [source release notes](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v5.2.0)
  describe additions and corrections. Counties, full translations, and hierarchy
  fields remain outside the offline package projection.

Publication must pass the [security release gates](./SECURITY.md), including npm
trusted-publisher configuration. No stored-token fallback is allowed.
