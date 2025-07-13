// Detection engine plugin system
import aubio from 'aubiojs';
type DetectionEvent = { time: number; strength?: number };

export interface DetectionResult {
  events: DetectionEvent[];
  detectionFunction: number[];
  times: number[];
}

export interface DetectionEngine {
  detect(
    audioBuffer: Float32Array | { getChannelData: (ch: number) => Float32Array },
    sampleRate: number,
    params: Record<string, unknown>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<DetectionResult> | DetectionResult;
}

export const aubioEngine: DetectionEngine = {
  async detect(audioBuffer, sampleRate, params, onProgress?: (processed: number, total: number) => void) {
    if (!audioBuffer || !sampleRate) return { events: [], detectionFunction: [], times: [] };
    const aubioModule = await aubio();
    const audioData: Float32Array = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
    const hopSize = typeof params?.hopSize === 'number' ? params.hopSize : 512;
    const bufferSize = typeof params?.bufferSize === 'number' ? params.bufferSize : 1024;
    const minDb = typeof params?.minDb === 'number' ? params.minDb : -60;
    const minDbDelta = typeof params?.minDbDelta === 'number' ? params.minDbDelta : 3;
    // @ts-expect-error: Runtime requires 4-argument Onset constructor ('default', bufferSize, hopSize, sampleRate)
    const onset = new aubioModule.Onset('default', bufferSize, hopSize, sampleRate);
    const events: DetectionEvent[] = [];
    const frame = new Float32Array(hopSize);
    const nFrames = Math.floor(audioData.length / hopSize);
    let prevDb = null;
    const detectionFunction: number[] = [];
    const times: number[] = [];
    for (let i = 0; i < nFrames; i++) {
      for (let j = 0; j < hopSize; j++) {
        frame[j] = audioData[i * hopSize + j] || 0;
      }
      if (onset.do(frame)) {
        const time = onset.getLastS();
        // Calculate dB for this frame
        const mag = frame.reduce((sum, v) => sum + Math.abs(v), 0) / hopSize;
        const db = 20 * Math.log10(mag + 1e-12);
        const dbDelta = prevDb !== null ? db - prevDb : 0;
        if (db > minDb && (prevDb === null || Math.abs(dbDelta) > minDbDelta)) {
          events.push({ time });
        }
        prevDb = db;
      }
      if (typeof onset.getDescriptor === 'function') {
        detectionFunction.push(onset.getDescriptor());
      } else {
        detectionFunction.push(0);
      }
      times.push((i * hopSize) / sampleRate);
      if (onProgress && (i % 500 === 0 || i === nFrames - 1)) {
        onProgress(i + 1, nFrames);
      }
    }
    return { events, detectionFunction, times };
  }
};

export const spectralFluxEngine: DetectionEngine = {
  detect(audioBuffer, sampleRate, params, onProgress?: (processed: number, total: number) => void) {
    if (!audioBuffer || !sampleRate) return { events: [], detectionFunction: [], times: [] };
    const audioData: Float32Array = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
    const hopSize = params?.hopSize as number || 512;
    const minDb = typeof params?.minDb === 'number' ? params.minDb : -60;
    const minDbDelta = typeof params?.minDbDelta === 'number' ? params.minDbDelta : 3;
    const nFrames = Math.floor(audioData.length / hopSize);
    let prevMag: number | null = null;
    let prevDb: number | null = null;
    const events: DetectionEvent[] = [];
    const detectionFunction: number[] = [];
    const times: number[] = [];
    for (let i = 0; i < nFrames; i++) {
      const frame = audioData.slice(i * hopSize, i * hopSize + hopSize);
      const mag = frame.reduce((sum, v) => sum + Math.abs(v), 0) / hopSize;
      detectionFunction.push(mag);
      times.push((i * hopSize) / sampleRate);
      const db = 20 * Math.log10(mag + 1e-12);
      const dbDelta = prevDb !== null ? db - prevDb : 0;
      if (prevMag !== null) {
        const flux = mag - prevMag;
        if (flux > 0.05 && db > minDb && (prevDb === null || Math.abs(dbDelta) > minDbDelta)) {
          events.push({ time: (i * hopSize) / sampleRate, strength: flux });
        }
      }
      prevMag = mag;
      prevDb = db;
      if (onProgress && (i % 500 === 0 || i === nFrames - 1)) {
        onProgress(i + 1, nFrames);
      }
    }
    return { events, detectionFunction, times };
  }
};

export const firstDerivativeEngine: DetectionEngine = {
  detect(audioBuffer, sampleRate, params, onProgress?: (processed: number, total: number) => void) {
    if (!audioBuffer || !sampleRate) return { events: [], detectionFunction: [], times: [] };
    const audioData: Float32Array = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
    const hopSize = params?.hopSize as number || 512;
    const minDb = typeof params?.minDb === 'number' ? params.minDb : -60;
    const minDbDelta = typeof params?.minDbDelta === 'number' ? params.minDbDelta : 3;
    const nFrames = Math.floor(audioData.length / hopSize);
    const detectionFunction: number[] = [];
    const times: number[] = [];
    const events: DetectionEvent[] = [];
    let prev = 0;
    let prevDb = null;
    for (let i = 0; i < nFrames; i++) {
      const frame = audioData.slice(i * hopSize, i * hopSize + hopSize);
      const avg = frame.reduce((sum, v) => sum + v, 0) / hopSize;
      const diff = avg - prev;
      detectionFunction.push(diff);
      times.push((i * hopSize) / sampleRate);
      const db = 20 * Math.log10(Math.abs(avg) + 1e-12);
      const dbDelta = prevDb !== null ? db - prevDb : 0;
      if (i > 0 && Math.abs(diff) > 0.1 && db > minDb && (prevDb === null || Math.abs(dbDelta) > minDbDelta)) {
        events.push({ time: times[i], strength: diff });
      }
      prev = avg;
      prevDb = db;
      if (onProgress && (i % 500 === 0 || i === nFrames - 1)) {
        onProgress(i + 1, nFrames);
      }
    }
    return { events, detectionFunction, times };
  }
};

export const secondDerivativeEngine: DetectionEngine = {
  detect(audioBuffer, sampleRate, params, onProgress?: (processed: number, total: number) => void) {
    if (!audioBuffer || !sampleRate) return { events: [], detectionFunction: [], times: [] };
    const audioData: Float32Array = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
    const hopSize = params?.hopSize as number || 512;
    const minDb = typeof params?.minDb === 'number' ? params.minDb : -60;
    const minDbDelta = typeof params?.minDbDelta === 'number' ? params.minDbDelta : 3;
    const nFrames = Math.floor(audioData.length / hopSize);
    const detectionFunction: number[] = [];
    const times: number[] = [];
    const events: DetectionEvent[] = [];
    let prev = 0, prevDiff = 0;
    let prevDb = null;
    for (let i = 0; i < nFrames; i++) {
      const frame = audioData.slice(i * hopSize, i * hopSize + hopSize);
      const avg = frame.reduce((sum, v) => sum + v, 0) / hopSize;
      const diff = avg - prev;
      const secondDiff = diff - prevDiff;
      detectionFunction.push(secondDiff);
      times.push((i * hopSize) / sampleRate);
      const db = 20 * Math.log10(Math.abs(avg) + 1e-12);
      const dbDelta = prevDb !== null ? db - prevDb : 0;
      if (i > 1 && Math.abs(secondDiff) > 0.1 && db > minDb && (prevDb === null || Math.abs(dbDelta) > minDbDelta)) {
        events.push({ time: times[i], strength: secondDiff });
      }
      prev = avg;
      prevDiff = diff;
      prevDb = db;
      if (onProgress && (i % 500 === 0 || i === nFrames - 1)) {
        onProgress(i + 1, nFrames);
      }
    }
    return { events, detectionFunction, times };
  }
};

export const zScoreEngine: DetectionEngine = {
  detect(audioBuffer, sampleRate, params, onProgress?: (processed: number, total: number) => void) {
    if (!audioBuffer || !sampleRate) return { events: [], detectionFunction: [], times: [] };
    const audioData: Float32Array = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
    const hopSize = params?.hopSize as number || 512;
    const minDb = typeof params?.minDb === 'number' ? params.minDb : -60;
    const minDbDelta = typeof params?.minDbDelta === 'number' ? params.minDbDelta : 3;
    const nFrames = Math.floor(audioData.length / hopSize);
    const detectionFunction: number[] = [];
    const times: number[] = [];
    const events: DetectionEvent[] = [];
    // Compute mean and stddev for z-score
    const frameMeans: number[] = [];
    let prevDb = null;
    for (let i = 0; i < nFrames; i++) {
      const frame = audioData.slice(i * hopSize, i * hopSize + hopSize);
      const meanVal = frame.reduce((sum, v) => sum + v, 0) / hopSize;
      frameMeans.push(meanVal);
    }
    const mean = frameMeans.reduce((a, b) => a + b, 0) / frameMeans.length;
    const std = Math.sqrt(frameMeans.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / frameMeans.length);
    for (let i = 0; i < nFrames; i++) {
      const z = std > 0 ? (frameMeans[i] - mean) / std : 0;
      detectionFunction.push(z);
      times.push((i * hopSize) / sampleRate);
      const db = 20 * Math.log10(Math.abs(frameMeans[i]) + 1e-12);
      const dbDelta = prevDb !== null ? db - prevDb : 0;
      if (Math.abs(z) > 2 && db > minDb && (prevDb === null || Math.abs(dbDelta) > minDbDelta)) {
        events.push({ time: times[i], strength: z });
      }
      prevDb = db;
      if (onProgress && (i % 500 === 0 || i === nFrames - 1)) {
        onProgress(i + 1, nFrames);
      }
    }
    return { events, detectionFunction, times };
  }
};

export const detectionEngines: Record<string, DetectionEngine> = {
  aubio: aubioEngine,
  'spectral-flux': spectralFluxEngine,
  'first-derivative': firstDerivativeEngine,
  'second-derivative': secondDerivativeEngine,
  'z-score': zScoreEngine,
}; 