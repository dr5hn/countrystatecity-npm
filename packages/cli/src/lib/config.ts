import Conf from 'conf';

let config: Conf | undefined;

/**
 * Creates the persistent config store only when a command needs it.
 */
function getConfig(): Conf {
  config ??= new Conf({
    projectName: 'csc',
    schema: {
      apiKey: { type: 'string', default: '' },
      apiBase: { type: 'string', default: 'https://api.countrystatecity.in/v1' },
    },
  });
  return config;
}

/**
 * Retrieves the stored API key, or undefined if not set.
 */
export function getApiKey(): string | undefined {
  const key = getConfig().get('apiKey') as string;
  return key || undefined;
}

/**
 * Persists the user's API key to local config.
 */
export function setApiKey(key: string): void {
  getConfig().set('apiKey', key);
}

/**
 * Removes the stored API key.
 */
export function clearApiKey(): void {
  getConfig().delete('apiKey');
}

/**
 * Returns the API base URL (includes the /v1 suffix — most SDK calls go here).
 */
export function getApiBase(): string {
  return getConfig().get('apiBase') as string;
}

/**
 * Returns the bare API host, without the /v1 suffix — for the handful of
 * routes (like /plans) that are mounted outside the versioned API and
 * aren't reachable through CSCClient.
 */
export function getApiHost(): string {
  return getApiBase().replace(/\/v1\/?$/, '');
}

/**
 * Returns true if an API key is currently stored.
 */
export function isAuthenticated(): boolean {
  return getApiKey() !== undefined;
}
