/**
 * TypeScript interfaces for @countrystatecity/geojson
 */

/**
 * GeoJSON Point geometry: [longitude, latitude], per the GeoJSON spec (RFC 7946).
 *
 * Note: upstream's own "geojson" exports (and this package) only ever produce
 * Point geometry — a single coordinate per country/state/city, not boundary
 * polygons. There is no shape/outline data available for choropleth-style
 * rendering; this package is a GeoJSON-formatted view of the same
 * latitude/longitude already available in @countrystatecity/countries.
 */
export interface IGeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IGeoJSONFeature<P> {
  type: 'Feature';
  geometry: IGeoJSONPoint;
  properties: P;
}

export interface IGeoJSONFeatureCollection<P> {
  type: 'FeatureCollection';
  features: IGeoJSONFeature<P>[];
}

export interface ICountryProperties {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
}

export interface IStateProperties {
  id: number;
  name: string;
  iso2: string;
  country_code: string;
}

export interface ICityProperties {
  id: number;
  name: string;
  state_code: string;
  country_code: string;
}

export type ICountryFeature = IGeoJSONFeature<ICountryProperties>;
export type IStateFeature = IGeoJSONFeature<IStateProperties>;
export type ICityFeature = IGeoJSONFeature<ICityProperties>;

export type ICountriesFeatureCollection = IGeoJSONFeatureCollection<ICountryProperties>;
export type IStatesFeatureCollection = IGeoJSONFeatureCollection<IStateProperties>;
export type ICitiesFeatureCollection = IGeoJSONFeatureCollection<ICityProperties>;

export interface ConfigOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  cacheSize?: number;
}
