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
import { getConfig, onConfigChange } from './config';
import { fetchJSON } from './fetcher';
import { LRUCache } from './cache';
import { NetworkError } from './errors';

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

// Entries cached under one baseURL/cacheSize must not survive a config change.
onConfigChange(clearCache);

/** A fresh, caller-owned empty FeatureCollection. */
function emptyCollection() {
  return { type: 'FeatureCollection' as const, features: [] };
}

/**
 * Shallow-copy a FeatureCollection so callers can mutate the collection and
 * its features array without poisoning the cached original.
 */
function copyCollection<T extends { features: unknown[] }>(collection: T): T {
  return { ...collection, features: [...collection.features] };
}

/** True when the error means "this file does not exist on the CDN" (HTTP 404). */
function isNotFound(error: unknown): boolean {
  return error instanceof NetworkError && error.statusCode === 404;
}

async function loadCached<T extends { features: unknown[] }>(key: string): Promise<T> {
  const c = getCache();
  const cached = c.get(key);
  if (cached !== undefined) return copyCollection(cached as T);
  const data = await fetchJSON<T>(`/data/${key}`);
  c.set(key, data);
  return copyCollection(data);
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
 * @returns FeatureCollection, empty if the country is not found or has no states
 * @throws NetworkError | TimeoutError on CDN/network failures (a 404 is NOT an error)
 */
export async function getStatesGeoJSON(countryCode: string): Promise<IStatesFeatureCollection> {
  if (!countryCode) return emptyCollection();
  try {
    return await loadCached<IStatesFeatureCollection>(`states/${countryCode.toUpperCase()}.geojson`);
  } catch (error) {
    if (isNotFound(error)) return emptyCollection();
    throw error;
  }
}

/**
 * Get all cities of a state as a GeoJSON FeatureCollection of Points.
 * @param countryCode - ISO2 country code
 * @param stateCode - State code
 * @returns FeatureCollection, empty if not found
 * @throws NetworkError | TimeoutError on CDN/network failures (a 404 is NOT an error)
 */
export async function getCitiesGeoJSON(
  countryCode: string,
  stateCode: string,
): Promise<ICitiesFeatureCollection> {
  if (!countryCode || !stateCode) return emptyCollection();
  try {
    return await loadCached<ICitiesFeatureCollection>(
      `cities/${countryCode.toUpperCase()}-${stateCode.toUpperCase()}.geojson`,
    );
  } catch (error) {
    if (isNotFound(error)) return emptyCollection();
    throw error;
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
