/**
 * LRU (Least Recently Used) cache for @countrystatecity/countries-browser
 * Uses Map iteration order (insertion order) for O(1) eviction
 */

export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  /**
   * Create a new LRU cache with the given maximum number of entries.
   * @param maxSize Maximum number of entries before oldest is evicted
   */
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Get a value from cache, marking it as most recently used.
   * Returns undefined on cache miss.
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value === undefined) return undefined;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Store a value in cache, evicting the oldest entry if at capacity.
   * If the key already exists, its value is updated and it becomes most recent.
   */
  set(key: K, value: V): void {
    this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value!;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove all entries from cache.
   */
  clear(): void {
    this.cache.clear();
  }
}
