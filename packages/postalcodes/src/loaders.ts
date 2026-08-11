/**
 * Dynamic data loaders for @countrystatecity/postalcodes
 * Uses dynamic import() to enable code-splitting and lazy loading
 * Falls back to fs.readFileSync for CommonJS environments
 */

import type { IPostalCode, IPostalCodeManifestEntry } from './types';

/**
 * Thrown by loadJSON when a data file simply does not exist (every candidate
 * path failed with ENOENT). Loaders translate this into an empty result;
 * every other failure (corrupted JSON, permission errors) propagates.
 */
class DataFileNotFoundError extends Error {
  code = 'MODULE_NOT_FOUND';
}

// Country dirs are strictly two uppercase letters; state files are short
// uppercase alphanumerics (the only other file, _unassigned.json, is never
// caller-addressable). Anything else never touches the filesystem.
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const STATE_CODE_PATTERN = /^[A-Z0-9]{1,10}$/;

/** Uppercase and validate an ISO2 country code; null if not plausibly one. */
function normalizeCountryCode(code: string): string | null {
  const normalized = String(code).toUpperCase();
  return COUNTRY_CODE_PATTERN.test(normalized) ? normalized : null;
}

/** Uppercase and validate a state code; null if not plausibly one. */
function normalizeStateCode(code: string): string | null {
  const normalized = String(code).toUpperCase();
  return STATE_CODE_PATTERN.test(normalized) ? normalized : null;
}

/**
 * Minimal LRU cache over Map insertion order, bounding memory while avoiding
 * a disk read + JSON.parse of multi-MB state files on every call.
 */
class LRUCache<V> {
  private entries = new Map<string, V>();
  constructor(private maxSize: number) {}

  /** Get a value, marking it most recently used; undefined on miss. */
  get(key: string): V | undefined {
    const value = this.entries.get(key);
    if (value === undefined) return undefined;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  /** Store a value, evicting the least recently used entry at capacity. */
  set(key: string, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.maxSize) {
      this.entries.delete(this.entries.keys().next().value!);
    }
  }

  /** Remove all entries. */
  clear(): void {
    this.entries.clear();
  }
}

let manifestCache: IPostalCodeManifestEntry[] | null = null;
const fileCache = new LRUCache<IPostalCode[]>(50);

/**
 * Clear all in-memory data caches (manifest and state files).
 * Mainly useful in tests; data only changes between package versions.
 */
export function clearCache(): void {
  manifestCache = null;
  fileCache.clear();
}

// Helper to check if we're in a Node.js environment
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' &&
         process.versions != null &&
         process.versions.node != null;
}

// Helper to conditionally import Node.js modules
// Uses webpack magic comment to prevent bundling in client-side code
async function importNodeModule(moduleName: string): Promise<any> {
  if (!isNodeEnvironment()) {
    throw new Error(`Module ${moduleName} is not available in browser environment`);
  }

  // The webpackIgnore magic comment tells webpack to not try to bundle this module
  // This works because webpack will see it's a runtime variable and skip it
  switch (moduleName) {
    case 'fs':
      return import(/* webpackIgnore: true */ 'fs');
    case 'path':
      return import(/* webpackIgnore: true */ 'path');
    case 'url':
      return import(/* webpackIgnore: true */ 'url');
    default:
      throw new Error(`Unsupported module: ${moduleName}`);
  }
}

// Helper function to load JSON data
//
// Note: this deliberately does NOT attempt a dynamic `import(path, { assert/with: { type: 'json' } })`
// before falling back to fs. That pattern is fragile across Node/bundler versions — Node 22+ requires
// the `with` import attribute (the older `assert` form is rejected), and esbuild has been observed to
// drop the attributes object entirely for non-literal specifiers, producing a bare `import(path)` that
// Node then refuses for `.json` files. Since this package is server-side only anyway (browser callers
// get the friendly error below regardless), reading the file directly via fs is simpler and version-stable.
async function loadJSON<T>(path: string): Promise<T> {
  if (!isNodeEnvironment()) {
    throw new Error(
      `@countrystatecity/postalcodes cannot load data in browser environments. ` +
      `This package is designed for server-side use only. ` +
      `Please use one of these approaches:\n` +
      `1. Create an API endpoint that calls this package on the server\n` +
      `2. Generate static JSON at build time\n` +
      `3. Use in SSR/SSG context only (e.g., SvelteKit load functions, Next.js server components)\n` +
      `See documentation at: https://github.com/dr5hn/countrystatecity-npm/tree/main/packages/postalcodes#readme`
    );
  }

  const fs = await importNodeModule('fs');
  const pathModule = await importNodeModule('path');
  const { fileURLToPath } = await importNodeModule('url');

  // Resolve path relative to this file
  let basePath: string;
  if (typeof __dirname !== 'undefined') {
    basePath = __dirname;
  } else {
    basePath = pathModule.dirname(fileURLToPath(import.meta.url));
  }

  // Try multiple path resolution strategies for different environments
  const possiblePaths = [
    pathModule.join(basePath, path),
    pathModule.join(basePath, '..', path), // In case dist structure is different
    pathModule.join(process.cwd(), 'node_modules', '@countrystatecity', 'postalcodes', 'dist', path), // Vercel/serverless
  ];

  let data: string | null = null;
  const readErrors: any[] = [];

  for (const fullPath of possiblePaths) {
    try {
      data = fs.readFileSync(fullPath, 'utf-8');
      break;
    } catch (readError) {
      readErrors.push(readError);
      continue;
    }
  }

  if (data === null) {
    // Missing file everywhere -> "not found"; anything else (EACCES, EISDIR, ...)
    // is a real environment problem the caller must see, not an empty result.
    const realError = readErrors.find((e) => e?.code !== 'ENOENT');
    if (realError) throw realError;
    throw new DataFileNotFoundError(
      `Failed to load JSON file: ${path}. Tried paths: ${possiblePaths.join(', ')}`
    );
  }

  return JSON.parse(data);
}

/**
 * Translate a data-loading failure into an empty result where that is the
 * documented contract (file absent, browser environment), rethrow otherwise.
 */
function handleLoadError(error: unknown): [] {
  if (error instanceof DataFileNotFoundError) return [];
  if (error instanceof Error && (error.message.includes('browser') || error.message.includes('Node.js environment'))) {
    console.warn(`@countrystatecity/postalcodes: ${error.message}`);
    return [];
  }
  throw error;
}

/**
 * Get the manifest of all countries that have postal code data.
 * Not all 250 countries have postal codes — currently ~125 do.
 * Cached in memory after the first load.
 * @bundle ~21KB - Loads manifest.json
 */
export async function getManifest(): Promise<IPostalCodeManifestEntry[]> {
  if (!manifestCache) {
    manifestCache = await loadJSON<IPostalCodeManifestEntry[]>('./data/manifest.json');
  }
  return [...manifestCache];
}

/**
 * Get all postal codes for a specific country + state.
 * @param countryCode - ISO2 country code (e.g., 'US', 'AD')
 * @param stateCode - State code as used by the upstream database
 * @returns Promise with array of postal codes, or empty array if not found
 * @bundle Varies by state — largest known file (Portugal's biggest state) is ~3.2MB
 */
export async function getPostalCodesOfState(
  countryCode: string,
  stateCode: string
): Promise<IPostalCode[]> {
  const country = normalizeCountryCode(countryCode);
  const state = normalizeStateCode(stateCode);
  if (!country || !state) return [];

  const key = `${country}/${state}`;
  const cached = fileCache.get(key);
  if (cached) return [...cached];

  try {
    const data = await loadJSON<IPostalCode[]>(`./data/${country}/${state}.json`);
    fileCache.set(key, data);
    return [...data];
  } catch (error) {
    return handleLoadError(error);
  }
}

/**
 * Get postal codes that have no state subdivision in the upstream data
 * (small territories/city-states, or a country's non-state-linked subset).
 * @param countryCode - ISO2 country code
 * @returns Promise with array of postal codes, or empty array if none
 */
export async function getUnassignedPostalCodesOfCountry(countryCode: string): Promise<IPostalCode[]> {
  const country = normalizeCountryCode(countryCode);
  if (!country) return [];

  const key = `${country}/_unassigned`;
  const cached = fileCache.get(key);
  if (cached) return [...cached];

  try {
    const data = await loadJSON<IPostalCode[]>(`./data/${country}/_unassigned.json`);
    fileCache.set(key, data);
    return [...data];
  } catch (error) {
    return handleLoadError(error);
  }
}

/**
 * Get ALL postal codes for an entire country: every state file plus the
 * unassigned bucket, concatenated.
 * WARNING: can be large — Portugal alone is ~197K records.
 * @param countryCode - ISO2 country code
 * @returns Promise with array of all postal codes in the country
 */
export async function getAllPostalCodesOfCountry(countryCode: string): Promise<IPostalCode[]> {
  const country = normalizeCountryCode(countryCode);
  if (!country) return [];

  const manifest = await getManifest();
  const entry = manifest.find((e) => e.country_code === country);
  if (!entry) return [];

  const all: IPostalCode[] = [];
  for (const stateCode of entry.state_codes) {
    all.push(...(await getPostalCodesOfState(country, stateCode)));
  }
  if (entry.has_unassigned) {
    all.push(...(await getUnassignedPostalCodesOfCountry(country)));
  }
  return all;
}
