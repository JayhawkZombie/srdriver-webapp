/* eslint-disable */
// Pluggable audio worker for onset/impulse detection (Vite-compatible, ES module)
import { detectionEngines } from './detectionEngines';
type DetectionEvent = { time: number; strength?: number };

globalThis.onmessage = async (e: MessageEvent) => {
  const { audioBuffer, sampleRate, params = {}, engine = 'spectral-flux', jobId, pcmBuffer, pcmLength, bands } = e.data as any;
  let events: DetectionEvent[] = [];
  let detectionFunction: number[] = [];
  let times: number[] = [];
  let error: string | null = null;

  try {
    console.log('aubioWorker', { audioBuffer, sampleRate, params, engine, pcmBuffer, pcmLength, bands });
    const selectedEngine = detectionEngines[engine];
    if (!selectedEngine) throw new Error('Unknown engine: ' + engine);
    let lastReported = 0;
    const onProgress = (processed: number, total: number) => {
      if (processed - lastReported >= 500 || processed === total) {
        lastReported = processed;
        globalThis.postMessage({ type: 'progress', processed, total, jobId });
      }
    };
    // Multi-band detection
    if (Array.isArray(bands) && bands.length > 0) {
      // Main PCM detection (if pcmBuffer provided)
      let mainResult = { events: [], detectionFunction: [], times: [] };
      if (pcmBuffer && pcmLength) {
        const mainPcm = new Float32Array(pcmBuffer, 0, pcmLength);
        mainResult = await selectedEngine.detect(mainPcm, sampleRate, params, onProgress);
      }
      // Each band
      const bandResults = await Promise.all(bands.map(async (band: any) => {
        if (band.pcmBuffer && band.pcmLength) {
          const bandPcm = new Float32Array(band.pcmBuffer, 0, band.pcmLength);
          return await selectedEngine.detect(bandPcm, sampleRate, params, onProgress);
        } else {
          return { events: [], detectionFunction: [], times: [] };
        }
      }));
      globalThis.postMessage({ type: 'done', main: mainResult, bands: bandResults, jobId });
      return;
    }
    // Single PCM detection (legacy)
    let inputPcm: Float32Array | undefined = undefined;
    if (pcmBuffer && pcmLength) {
      inputPcm = new Float32Array(pcmBuffer, 0, pcmLength);
    } else if (audioBuffer instanceof Float32Array) {
      inputPcm = audioBuffer;
    } else if (audioBuffer && typeof audioBuffer.getChannelData === 'function') {
      inputPcm = audioBuffer.getChannelData(0);
    }
    if (!inputPcm) throw new Error('No PCM data provided');
    const result = selectedEngine.detect.length >= 4
      ? await (selectedEngine.detect as any)(inputPcm, sampleRate, params, onProgress)
      : await selectedEngine.detect(inputPcm, sampleRate, params);
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