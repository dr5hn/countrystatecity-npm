/**
 * Data loaders for @countrystatecity/geojson
 * Uses fetch API to load GeoJSON FeatureCollections from jsDelivr CDN with LRU caching
 */

import type {
  ICountriesFeatureCollection,
  IStatesFeatureCollection,
  ICitiesFeatureCollection,
  ICountryFeature,
} from './types';
import { getConfig } from './config';
import { fetchJSON } from './fetcher';
import { LRUCache } from './cache';

let cache: LRUCache<string, unknown> | null = null;

function getCache(): LRUCache<string, unknown> {
  if (!cache) {
    cache = new LRUCache<string, unknown>(getConfig().cacheSize);
  }
  return cache;
}

/**
 * Clear the cache (forces re-initialization on next use, picking up any config changes)
 */
export function clearCache(): void {
  cache = null;
}

const EMPTY_COLLECTION = { type: 'FeatureCollection' as const, features: [] };

async function loadCached<T>(key: string): Promise<T> {
  const c = getCache();
  const cached = c.get(key);
  if (cached !== undefined) return cached as T;
  const data = await fetchJSON<T>(`/data/${key}`);
  c.set(key, data);
  return data;
}

/**
 * Get all countries as a GeoJSON FeatureCollection of Points.
 * @returns FeatureCollection with one Point feature per country
 */
export async function getCountriesGeoJSON(): Promise<ICountriesFeatureCollection> {
  return loadCached<ICountriesFeatureCollection>('countries.geojson');
}

/**
 * Get a single country as a GeoJSON Point feature.
 * @param countryCode - ISO2 country code
 * @returns Feature or null if not found
 */
export async function getCountryGeoJSON(countryCode: string): Promise<ICountryFeature | null> {
  if (!countryCode) return null;
  const collection = await getCountriesGeoJSON();
  const code = countryCode.toUpperCase();
  return collection.features.find((f) => f.properties.iso2 === code) || null;
}

/**
 * Get all states/provinces of a country as a GeoJSON FeatureCollection of Points.
 * @param countryCode - ISO2 country code
 * @returns FeatureCollection, empty if country not found or has no states
 */
export async function getStatesGeoJSON(countryCode: string): Promise<IStatesFeatureCollection> {
  if (!countryCode) return EMPTY_COLLECTION;
  try {
    return await loadCached<IStatesFeatureCollection>(`states/${countryCode.toUpperCase()}.geojson`);
  } catch {
    return EMPTY_COLLECTION;
  }
}

/**
 * Get all cities of a state as a GeoJSON FeatureCollection of Points.
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns FeatureCollection, empty if not found
 */
export async function getCitiesGeoJSON(
  countryCode: string,
  stateCode: string,
): Promise<ICitiesFeatureCollection> {
  if (!countryCode || !stateCode) return EMPTY_COLLECTION;
  try {
    return await loadCached<ICitiesFeatureCollection>(
      `cities/${countryCode.toUpperCase()}-${stateCode.toUpperCase()}.geojson`,
    );
  } catch {
    return EMPTY_COLLECTION;
  }
}

/**
 * Get ALL cities in an entire country as a single GeoJSON FeatureCollection.
 * WARNING: loads all state city files for the country.
 * @param countryCode - ISO2 country code
 */
export async function getAllCitiesGeoJSONOfCountry(countryCode: string): Promise<ICitiesFeatureCollection> {
  const states = await getStatesGeoJSON(countryCode);
  const collections = await Promise.all(
    states.features.map((s) => getCitiesGeoJSON(countryCode, s.properties.iso2)),
  );
  return {
    type: 'FeatureCollection',
    features: collections.flatMap((c) => c.features),
  };
}
