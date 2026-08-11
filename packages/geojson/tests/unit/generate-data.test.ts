/**
 * Regression tests for the generator's coordinate validation (PR #3 review):
 * non-numeric coordinate strings must be rejected, never serialized as
 * spec-invalid [null, null] GeoJSON coordinates.
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { hasCoordinates, toPoint } = require('../../scripts/generate-data.cjs');

describe('hasCoordinates', () => {
  it('accepts numeric coordinate strings', () => {
    expect(hasCoordinates({ latitude: '34.05', longitude: '-118.24' })).toBe(true);
  });

  it('rejects missing coordinates', () => {
    expect(hasCoordinates({ latitude: null, longitude: '-118.24' })).toBe(false);
    expect(hasCoordinates({ latitude: '', longitude: '-118.24' })).toBe(false);
  });

  it('rejects non-numeric coordinate strings instead of emitting NaN', () => {
    expect(hasCoordinates({ latitude: 'N/A', longitude: '-118.24' })).toBe(false);
    expect(hasCoordinates({ latitude: '34.05', longitude: 'unknown' })).toBe(false);
  });

  it('rejects partially-numeric strings that parseFloat would silently truncate', () => {
    expect(hasCoordinates({ latitude: '1.0N', longitude: '-118.24' })).toBe(false);
  });
});

describe('toPoint', () => {
  it('produces [longitude, latitude] numeric coordinates', () => {
    expect(toPoint('34.05', '-118.24')).toEqual({
      type: 'Point',
      coordinates: [-118.24, 34.05],
    });
  });
});
