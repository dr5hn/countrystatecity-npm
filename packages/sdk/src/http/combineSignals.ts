/**
 * Manual composition of multiple AbortSignals into one.
 *
 * Node 18 (the SDK's minimum supported runtime) does not have
 * `AbortSignal.any()` — that landed in Node 20.3 — so signals are composed
 * by hand here instead.
 */

export interface ICombinedSignal {
  signal: AbortSignal;
  dispose: () => void;
}

export function combineSignals(signals: Array<AbortSignal | undefined>): ICombinedSignal {
  const active = signals.filter((s): s is AbortSignal => s !== undefined);
  const controller = new AbortController();

  if (active.some((s) => s.aborted)) {
    controller.abort();
    return { signal: controller.signal, dispose: () => {} };
  }

  const listeners: Array<[AbortSignal, () => void]> = [];
  for (const s of active) {
    const onAbort = () => controller.abort();
    s.addEventListener('abort', onAbort, { once: true });
    listeners.push([s, onAbort]);
  }

  const dispose = () => {
    for (const [s, fn] of listeners) s.removeEventListener('abort', fn);
  };

  return { signal: controller.signal, dispose };
}
