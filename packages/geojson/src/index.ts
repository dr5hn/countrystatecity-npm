/**
 * @countrystatecity/geojson
 * Countries, states, and cities as GeoJSON Point FeatureCollections, loaded via jsDelivr CDN.
 *
 * Note: these are Point features (one coordinate per country/state/city),
 * not boundary polygons — there is no shape/outline data available upstream
 * for choropleth-style rendering.
 */

export type {
  IGeoJSONPoint,
  IGeoJSONFeature,
  IGeoJSONFeatureCollection,
  ICountryProperties,
  IStateProperties,
  ICityProperties,
  ICountryFeature,
  IStateFeature,
  ICityFeature,
  ICountriesFeatureCollection,
  IStatesFeatureCollection,
  ICitiesFeatureCollection,
  ConfigOptions,
} from './types';

export { NetworkError, TimeoutError } from './errors';

export { configure, resetConfiguration } from './config';

export { clearCache } from './loaders';

export {
  getCountriesGeoJSON,
  getCountryGeoJSON,
  getStatesGeoJSON,
  getCitiesGeoJSON,
  getAllCitiesGeoJSONOfCountry,
} from './loaders';

export { getCountriesGeoJSON as default } from './loaders';
