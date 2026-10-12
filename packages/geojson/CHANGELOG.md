# @countrystatecity/geojson

## 2.0.0

### Major Changes

Data now comes from upstream **v4.0-export.50**. The v3.2 → v4.0 transition removed 4,486 city ids (duplicates, US counties moved to a separate counties dataset, and non-places), reassigned 7,527 cities to different states, and added 27 states while retiring 6. Stored ids and per-state results can change; US counties are no longer returned as cities. Later export corrections are included in this snapshot.

Before upgrading stored city/state ids, use [`removed_ids_v3.2_to_v4.0.csv`](https://github.com/dr5hn/countries-states-cities-database/releases/download/v4.0/removed_ids_v3.2_to_v4.0.csv) attached to the [upstream v4.0 release](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v4.0). It identifies merged ids and their survivors, counties moved to new ids, and retired states and their successors. Match the `record`, `outcome`, and `new_table` columns before using `new_id`; a county id is not a city id. Refresh stored state associations against this snapshot.

Feature ids and state membership change with the source data. Properties remain a minimal projection (`id`, `name`, and country/state codes); upstream `type`, `type_local`, `county_id`, `level`, and `parent_id` are intentionally omitted. Geometry remains `Point`, not administrative boundary polygons.

Removed obsolete data files retained by previous CI artifact overlays; retired state files and duplicate city/postal records no longer remain beside the current snapshot.

## 1.0.2

### Patch Changes

- Hardened configuration, cache isolation, network error handling, and coordinate validation.

## 1.0.1

### Patch Changes

- Updated data from countries-states-cities-database
