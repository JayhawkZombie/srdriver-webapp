/* eslint-disable */
// Pluggable audio worker for onset/impulse detection (Vite-compatible, ES module)
import { detectionEngines } from './detectionEngines';
import type { DetectionEvent } from '../components/upgrade/types';

globalThis.onmessage = async (e: MessageEvent) => {
  const { audioBuffer, sampleRate, params = {}, engine = 'spectral-flux' } = e.data as {
    audioBuffer: Float32Array | { getChannelData: (ch: number) => Float32Array };
    sampleRate: number;
    params?: any;
    engine?: string;
  };
  let events: DetectionEvent[] = [];
  let detectionFunction: number[] = [];
  let times: number[] = [];
  let error: string | null = null;

  try {
    const selectedEngine = detectionEngines[engine];
    if (!selectedEngine) throw new Error('Unknown engine: ' + engine);
    const result = selectedEngine.detect(audioBuffer, sampleRate, params);
    const resolved = result instanceof Promise ? await result : result;
    events = resolved.events;
    detectionFunction = resolved.detectionFunction;
    times = resolved.times;
  } catch (err: unknown) {
    if (err instanceof Error) {
      error = err.message;
    } else {
      error = String(err);
    }
  }

  globalThis.postMessage({ events, detectionFunction, times, error });
}; 