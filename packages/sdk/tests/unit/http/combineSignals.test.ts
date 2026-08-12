import { describe, it, expect } from 'vitest';
import { combineSignals } from '../../../src/http/combineSignals';

describe('combineSignals', () => {
  it('with no signals, never aborts', () => {
    const { signal } = combineSignals([]);
    expect(signal.aborted).toBe(false);
  });

  it('is aborted immediately if a signal is already aborted', () => {
    const controller = new AbortController();
    controller.abort();
    const { signal } = combineSignals([controller.signal]);
    expect(signal.aborted).toBe(true);
  });

  it('aborts when either input signal aborts', () => {
    const a = new AbortController();
    const b = new AbortController();
    const { signal } = combineSignals([a.signal, b.signal]);

    expect(signal.aborted).toBe(false);
    b.abort();
    expect(signal.aborted).toBe(true);
  });

  it('ignores undefined entries', () => {
    const a = new AbortController();
    const { signal } = combineSignals([undefined, a.signal, undefined]);
    expect(signal.aborted).toBe(false);
    a.abort();
    expect(signal.aborted).toBe(true);
  });

  it('dispose() removes listeners so later aborts on sources are inert for the combined signal', () => {
    const a = new AbortController();
    const { signal, dispose } = combineSignals([a.signal]);
    dispose();
    a.abort();
    // The combined controller was never told to abort after dispose, so its signal stays clean.
    expect(signal.aborted).toBe(false);
  });
});
