# @countrystatecity/geojson

[![npm](https://img.shields.io/npm/v/@countrystatecity/geojson)](https://www.npmjs.com/package/@countrystatecity/geojson)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)

Countries, states, and cities as GeoJSON `Point` `FeatureCollection`s, loaded via jsDelivr CDN with in-memory LRU caching — same architecture as [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser).

**Environment:** 🌐 **Browser / Any** (no Node.js dependencies)

## Upgrading to 3.0.0

This version uses **v5.0.0-export.1**. Review the [upstream v5 migration notes](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v5.0.0) before updating stored IDs: some records were retired or had their identities repaired. City state links can now be null. Country-wide city loaders include these records. Preserve the supplied `NOTICE-*.txt` files with redistributed data. See the [package migration guide](https://github.com/dr5hn/countrystatecity-npm/blob/main/MIGRATING-V5.md).

## Earlier migration: 2.0.0

Data now comes from upstream **v4.0-export.50**. The v3.2 → v4.0 transition removed 4,486 city ids (duplicates, US counties moved to a separate counties dataset, and non-places), reassigned 7,527 cities to different states, and added 27 states while retiring 6. Stored ids and per-state results can change; US counties are no longer returned as cities. Later export corrections are included in this snapshot.

Before upgrading stored city/state ids, use [`removed_ids_v3.2_to_v4.0.csv`](https://github.com/dr5hn/countries-states-cities-database/releases/download/v4.0/removed_ids_v3.2_to_v4.0.csv) attached to the [upstream v4.0 release](https://github.com/dr5hn/countries-states-cities-database/releases/tag/v4.0). It identifies merged ids and their survivors, counties moved to new ids, and retired states and their successors. Match the `record`, `outcome`, and `new_table` columns before using `new_id`; a county id is not a city id. Refresh stored state associations against this snapshot.

Feature ids and state membership change with the source data. Properties remain a minimal projection (`id`, `name`, and country/state codes); upstream `type`, `type_local`, `county_id`, `level`, and `parent_id` are intentionally omitted. Geometry remains `Point`, not administrative boundary polygons.

## ⚠️ Point geometry only — not boundary polygons

Every feature in this package is a single `Point` (one coordinate per country/state/city) — the same latitude/longitude already available via `@countrystatecity/countries`. **There are no country/state boundary shapes (polygons) available** — this package cannot power choropleth maps or shape-outline rendering. It exists to save you the one-line transform from `{lat, lng}` to a GeoJSON `Feature`, and to give you CDN-hosted, lazy-loaded `FeatureCollection`s pre-split by country/state for direct use with `L.geoJSON()` (Leaflet) or as a Mapbox GL source.

If you need real boundary polygons, this package is not it — no such data is currently published upstream.

## ✨ Features

- 📍 250 countries, 5,000+ states, 150,000+ cities as GeoJSON `Point` features
- 🔄 Lazy loading: per-country state files, per-state city files
- 🌐 CDN-hosted via jsDelivr with LRU in-memory caching
- 📝 TypeScript types for `Feature`/`FeatureCollection`/properties per level

## 📦 Installation

```bash
npm install @countrystatecity/geojson
```

## 🚀 Quick Start

```typescript
import { getCountriesGeoJSON, getStatesGeoJSON, getCitiesGeoJSON } from '@countrystatecity/geojson';

const countries = await getCountriesGeoJSON();
// { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [-97, 38] }, properties: { id: 233, name: 'United States', iso2: 'US', iso3: 'USA' } }, ...] }

// Drop straight into Leaflet:
// L.geoJSON(countries).addTo(map);

const states = await getStatesGeoJSON('US');
const cities = await getCitiesGeoJSON('US', 'CA');
```

## Local package or live API?

This package ships a free, offline-capable snapshot of the data — that's still the right choice when the app must work offline, a periodic snapshot is enough, or you just need simple point-geometry lookups.

This package's GeoJSON data isn't part of the live [CountryStateCity API](https://countrystatecity.in) yet (and as noted above, neither has boundary polygons). But if your app also needs countries, states, cities, currencies, phone codes, timezones, or fuzzy search, [`@countrystatecity/sdk`](https://www.npmjs.com/package/@countrystatecity/sdk) covers those live, with freshness, server-side search, and configurable rate limits beyond a bundled snapshot.

**Start free with 3,000 requests per month.** [Compare plans](https://countrystatecity.in/pricing?source=npm&campaign=sdk_api_migration&package=geojson) or [get an API key](https://app.countrystatecity.in?source=npm&campaign=sdk_api_migration&package=geojson).

```bash
npm install @countrystatecity/sdk
```

See the [full migration guide](https://github.com/dr5hn/countrystatecity-npm/blob/main/packages/sdk/MIGRATION.md) for what's covered today.

## 📖 API Reference

#### `getCountriesGeoJSON()`
All countries as a `FeatureCollection` of `Point` features.
- **Returns:** `Promise<ICountriesFeatureCollection>`

#### `getCountryGeoJSON(countryCode)`
A single country as one `Point` feature.
- **Returns:** `Promise<ICountryFeature | null>`

#### `getStatesGeoJSON(countryCode)`
All states/provinces of a country as a `FeatureCollection`.
- **Returns:** `Promise<IStatesFeatureCollection>`

#### `getCitiesGeoJSON(countryCode, stateCode)`
All cities of a state as a `FeatureCollection`.
- **Returns:** `Promise<ICitiesFeatureCollection>`

#### `getAllCitiesGeoJSONOfCountry(countryCode)`
All cities in an entire country, merged into one `FeatureCollection`.
- **Warning:** loads every state's city file for that country.
- **Returns:** `Promise<ICitiesFeatureCollection>`

### Configuration

```typescript
import { configure, resetConfiguration } from '@countrystatecity/geojson';

configure({
  baseURL: 'https://your-cdn.example.com/geojson',
  timeout: 8000,
  cacheSize: 100,
});
```

## 🔧 TypeScript Types

```typescript
import type {
  IGeoJSONFeature,
  IGeoJSONFeatureCollection,
  ICountryProperties,
  IStateProperties,
  ICityProperties,
} from '@countrystatecity/geojson';
```

## 📊 Data Source

Generated from the same underlying data as [`@countrystatecity/countries`](https://www.npmjs.com/package/@countrystatecity/countries), which sources from [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database). Report data issues (wrong coordinates, missing entries) there.

## 📄 License

ODbL-1.0
