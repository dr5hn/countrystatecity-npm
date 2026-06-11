/**
 * Configuration management for @countrystatecity/countries-browser
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
  baseURL: `https://cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@${__VERSION__}/dist`,
  timeout: 5000,
  headers: {},
  cacheSize: 50,
};

let currentConfig: ResolvedConfig = { ...DEFAULT_CONFIG };

/**
 * Get the current resolved configuration
 */
export function getConfig(): ResolvedConfig {
  return currentConfig;
}

/**
 * Override default configuration options
 * @param options - Partial configuration to merge with defaults
 */
export function configure(options: ConfigOptions): void {
  currentConfig = { ...currentConfig, ...options } as ResolvedConfig;
}

/**
 * Reset configuration to defaults
 */
export function resetConfiguration(): void {
  currentConfig = { ...DEFAULT_CONFIG };
}
