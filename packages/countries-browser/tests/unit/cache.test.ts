import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../../src/cache';

describe('LRUCache', () => {
  let cache: LRUCache<string, string[]>;

  beforeEach(() => {
    cache = new LRUCache<string, string[]>(3);
  });

  it('returns undefined for cache miss', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('stores and retrieves values', () => {
    cache.set('key1', ['a', 'b']);
    expect(cache.get('key1')).toEqual(['a', 'b']);
  });

  it('evicts oldest entry when over max size', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.set('c', ['3']);
    cache.set('d', ['4']);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toEqual(['2']);
    expect(cache.get('d')).toEqual(['4']);
  });

  it('moves accessed entry to most recent on get', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.set('c', ['3']);
    cache.get('a');
    cache.set('d', ['4']);
    expect(cache.get('a')).toEqual(['1']);
    expect(cache.get('b')).toBeUndefined();
  });

  it('overwrites existing key without growing size', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.set('c', ['3']);
    cache.set('a', ['updated']);
    expect(cache.get('a')).toEqual(['updated']);
    expect(cache.get('b')).toEqual(['2']);
    expect(cache.get('c')).toEqual(['3']);
  });

  it('clears all entries', () => {
    cache.set('a', ['1']);
    cache.set('b', ['2']);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});
