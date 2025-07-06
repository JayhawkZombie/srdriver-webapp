/* eslint-disable */
// Pluggable audio worker for onset/impulse detection (Vite-compatible, ES module)
import { detectionEngines } from './detectionEngines';
type DetectionEvent = { time: number; strength?: number };

globalThis.onmessage = async (e: MessageEvent) => {
  const { audioBuffer, sampleRate, params = {}, engine = 'spectral-flux', jobId } = e.data as {
    audioBuffer: Float32Array | { getChannelData: (ch: number) => Float32Array };
    sampleRate: number;
    params?: any;
    engine?: string;
    jobId?: string;
  };
  let events: DetectionEvent[] = [];
  let detectionFunction: number[] = [];
  let times: number[] = [];
  let error: string | null = null;

  try {
    console.log('aubioWorker', { audioBuffer, sampleRate, params, engine });
    const selectedEngine = detectionEngines[engine];
    if (!selectedEngine) throw new Error('Unknown engine: ' + engine);
    let lastReported = 0;
    const onProgress = (processed: number, total: number) => {
      if (processed - lastReported >= 500 || processed === total) {
        lastReported = processed;
        globalThis.postMessage({ type: 'progress', processed, total, jobId });
      }
    };
    const result = selectedEngine.detect.length >= 4
      ? await (selectedEngine.detect as any)(audioBuffer, sampleRate, params, onProgress)
      : await selectedEngine.detect(audioBuffer, sampleRate, params);
    events = result.events;
    detectionFunction = result.detectionFunction;
    times = result.times;
  } catch (err: unknown) {
    if (err instanceof Error) {
      error = err.message;
    } else {
      error = String(err);
    }
  }

  globalThis.postMessage({ type: 'done', events, detectionFunction, times, error, jobId });
}; 