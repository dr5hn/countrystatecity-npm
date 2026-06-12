import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the conf module before importing config
vi.mock('conf', () => {
  const store: Record<string, unknown> = {};
  return {
    default: class MockConf {
      constructor() {}
      get(key: string) {
        return store[key] ?? (key === 'apiBase' ? 'https://api.countrystatecity.in/v1' : '');
      }
      set(key: string, value: unknown) {
        store[key] = value;
      }
      delete(key: string) {
        delete store[key];
      }
      // expose store for test reset
      static _store = store;
      static _reset() {
        for (const key of Object.keys(store)) delete store[key];
      }
    },
  };
});

import { getApiKey, setApiKey, clearApiKey, getApiBase, isAuthenticated } from '../../src/lib/config.js';
import Conf from 'conf';

describe('config', () => {
  beforeEach(() => {
    (Conf as unknown as { _reset: () => void })._reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined when no API key is set', () => {
    expect(getApiKey()).toBeUndefined();
  });

  it('stores and retrieves an API key', () => {
    setApiKey('test-key-123');
    expect(getApiKey()).toBe('test-key-123');
  });

  it('clears the API key', () => {
    setApiKey('test-key-123');
    clearApiKey();
    expect(getApiKey()).toBeUndefined();
  });

  it('returns the default API base URL', () => {
    expect(getApiBase()).toBe('https://api.countrystatecity.in/v1');
  });

  it('returns false when not authenticated', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('returns true when authenticated', () => {
    setApiKey('test-key-123');
    expect(isAuthenticated()).toBe(true);
  });
});
