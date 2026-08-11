/**
 * Configuration management for @countrystatecity/geojson
 */

import type { ConfigOptions } from './types';

declare const __VERSION__: string;

interface ResolvedConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  cacheSize: number;
}

const DEFAULT_CONFIG: ResolvedConfig = {
  baseURL: `https://cdn.jsdelivr.net/npm/@countrystatecity/geojson@${__VERSION__}/dist`,
  timeout: 5000,
  headers: {},
  cacheSize: 50,
};

let currentConfig: ResolvedConfig = { ...DEFAULT_CONFIG };

const changeListeners: Array<() => void> = [];

/**
 * Register a callback invoked whenever the configuration changes.
 * Used by the loader layer to invalidate caches keyed on old settings.
 */
export function onConfigChange(listener: () => void): void {
  changeListeners.push(listener);
}

function notifyConfigChanged(): void {
  for (const listener of changeListeners) listener();
}

/**
 * Get the current resolved configuration
 */
export function getConfig(): ResolvedConfig {
  return currentConfig;
}

/**
 * Override default configuration options.
 * Properties that are explicitly undefined are ignored, so callers can pass
 * through optional values without clobbering defaults.
 * @param options - Partial configuration to merge with defaults
 */
export function configure(options: ConfigOptions): void {
  const defined = Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined)
  );
  currentConfig = { ...currentConfig, ...defined } as ResolvedConfig;
  notifyConfigChanged();
}

/**
 * Reset configuration to defaults
 */
export function resetConfiguration(): void {
  currentConfig = { ...DEFAULT_CONFIG };
  notifyConfigChanged();
}
