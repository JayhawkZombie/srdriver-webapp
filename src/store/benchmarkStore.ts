import { useSyncExternalStore, useRef } from 'react';

export type BenchmarkSample = { timestamp: number; value: number; label?: string; meta?: unknown };

interface BenchmarkState {
  timeSeries: { [key: string]: BenchmarkSample[] };
  oneOffs: { [key: string]: BenchmarkSample };
}

// --- Singleton store ---
const state: BenchmarkState = {
  timeSeries: {},
  oneOffs: {},
};

let listeners: (() => void)[] = [];

function emit() {
  for (const l of listeners) l();
}

export const benchmarkStore = {
  reportBenchmark(key: string, value: number, label?: string, meta?: unknown) {
    const arr = state.timeSeries[key] || [];
    const sample = { timestamp: Date.now(), value, label, meta };
    state.timeSeries[key] = [...arr, sample].slice(-120);
    emit();
  },
  reportOneOff(key: string, value: number, label?: string, meta?: unknown) {
    state.oneOffs[key] = { timestamp: Date.now(), value, label, meta };
    emit();
  },
  clear() {
    state.timeSeries = {};
    state.oneOffs = {};
    emit();
  },
  getTimeSeries() {
    return state.timeSeries;
  },
  getOneOffs() {
    return state.oneOffs;
  },
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
};

// --- React hook for subscribing to the store ---
export function useBenchmarkStore() {
  return useSyncExternalStore(
    benchmarkStore.subscribe,
    () => state // Return the singleton state object directly for referential stability
  );
}

// --- Timing helpers ---
export async function benchmarkAsync<T>(key: string, label: string, fn: () => Promise<T>) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  benchmarkStore.reportBenchmark(key, end - start, label);
  return result;
}
export function benchmarkSync<T>(key: string, label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  benchmarkStore.reportBenchmark(key, end - start, label);
  return result;
}

/**
 * useBenchmark(key):
 *   const bench = useBenchmark('ble');
 *   bench.begin('connect');
 *   ...code...
 *   bench.end(); // reports elapsed time as a one-off with label 'connect'
 *   bench.report(42, 'custom'); // manually report a value
 */
export function useBenchmark(key: string) {
  const startRef = useRef<{ time: number; label?: string } | null>(null);
  return {
    begin(label?: string) {
      startRef.current = { time: performance.now(), label };
    },
    end() {
      if (startRef.current) {
        const elapsed = performance.now() - startRef.current.time;
        benchmarkStore.reportOneOff(key, elapsed, startRef.current.label);
        startRef.current = null;
      }
    },
    report(value: number, label?: string) {
      benchmarkStore.reportOneOff(key, value, label);
    },
  };
} 