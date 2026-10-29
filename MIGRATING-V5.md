# Updating packages to upstream v5 data

The offline packages now use the exact snapshot `v5.0.0-export.1`.
`countries`, `countries-browser`, `geojson`, and `postalcodes` move to package
version 3.0.0 because upstream removes or repairs stored IDs and allows cities
without a state. The live API clients still use the API's data version.

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

## The 1 November refresh

The upstream v5.1.0 cut is planned for 31 October / 1 November 2026. It corrects
existing populations, types, time zones, Wikidata values, coordinates and hierarchy
links; it does not change IDs according to the draft release notes. The package
pipeline must fetch the published export, not unreleased master data. Its normal
Sunday refresh runs on 1 November at 00:00 UTC (05:30 India time). If the export is
published later, date-limited follow-ups dispatch the same checked pipeline at
06:00 and 12:00 UTC (11:30 and 17:30 India time). Those runs may merge and release
only a published `v5.1.0-export.N` on 1 November 2026, after all checks pass.
Review the resulting
manifest, changed IDs, country-level cities, postal counts, and notices before
merging the next data PR. The corrected pipeline retains population reference
years and includes all cities in its full-file coverage check.
