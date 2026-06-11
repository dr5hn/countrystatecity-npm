import { describe, it, expect } from 'vitest';
import { NetworkError, TimeoutError } from '../../src/errors';

describe('NetworkError', () => {
  it('stores url and statusCode', () => {
    const error = new NetworkError('Failed to load', 'https://cdn.example.com/data.json', 404);
    expect(error.message).toBe('Failed to load');
    expect(error.url).toBe('https://cdn.example.com/data.json');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NetworkError');
    expect(error).toBeInstanceOf(Error);
  });

  it('works without statusCode', () => {
    const error = new NetworkError('Network failed', 'https://cdn.example.com/data.json');
    expect(error.statusCode).toBeUndefined();
  });
});

describe('TimeoutError', () => {
  it('stores timeout value', () => {
    const error = new TimeoutError('Request timed out', 5000);
    expect(error.message).toBe('Request timed out');
    expect(error.timeout).toBe(5000);
    expect(error.name).toBe('TimeoutError');
    expect(error).toBeInstanceOf(Error);
  });
});
