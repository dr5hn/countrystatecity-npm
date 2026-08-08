# @countrystatecity/geojson

[![npm](https://img.shields.io/npm/v/@countrystatecity/geojson)](https://www.npmjs.com/package/@countrystatecity/geojson)
[![CI](https://github.com/dr5hn/countrystatecity-npm/workflows/Pipeline/badge.svg)](https://github.com/dr5hn/countrystatecity-npm/actions/workflows/ci.yml)

Countries, states, and cities as GeoJSON `Point` `FeatureCollection`s, loaded via jsDelivr CDN with in-memory LRU caching — same architecture as [`@countrystatecity/countries-browser`](https://www.npmjs.com/package/@countrystatecity/countries-browser).

**Environment:** 🌐 **Browser / Any** (no Node.js dependencies)

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
