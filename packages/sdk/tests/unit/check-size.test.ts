import { describe, it, expect } from 'vitest';
import { checkSize, formatKB, BUDGET_BYTES } from '../../scripts/check-size.cjs';

describe('checkSize', () => {
  it('passes when gzip size is under budget', () => {
    const result = checkSize(10 * 1024, 20 * 1024);
    expect(result.ok).toBe(true);
  });

  it('passes when gzip size exactly equals budget', () => {
    const result = checkSize(20 * 1024, 20 * 1024);
    expect(result.ok).toBe(true);
  });

  it('fails when gzip size exceeds budget', () => {
    const result = checkSize(20 * 1024 + 1, 20 * 1024);
    expect(result.ok).toBe(false);
  });

  it('reports the actual measured size in the real budget', () => {
    expect(BUDGET_BYTES).toBe(20 * 1024);
  });
});

describe('formatKB', () => {
  it('formats bytes as a 2-decimal KB string', () => {
    expect(formatKB(6391)).toBe('6.24KB');
    expect(formatKB(20 * 1024)).toBe('20.00KB');
  });
});
