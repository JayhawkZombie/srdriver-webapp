// @ts-nocheck
/* eslint-disable */
// Pluggable audio worker for onset/impulse detection (Vite-compatible, ES module)
// Supports multiple engines: 'aubio', 'spectral-flux', etc.
import aubio from 'aubiojs';
import { DetectionEvent } from './types';

let aubioModule: any = null;

globalThis.onmessage = async (e: MessageEvent) => {
  const { audioBuffer, sampleRate, params = {}, engine = 'spectral-flux' } = e.data as {
    audioBuffer: Float32Array | { getChannelData: (ch: number) => Float32Array };
    sampleRate: number;
    params?: any;
    engine?: string;
  };
  let events: DetectionEvent[] = [];
  let error: string | null = null;

  try {
    if (engine === 'aubio') {
      events = await detectWithAubio(audioBuffer, sampleRate, params);
    } else if (engine === 'spectral-flux') {
      events = detectWithSpectralFlux(audioBuffer, sampleRate, params);
    } else {
      error = 'Unknown engine: ' + engine;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      error = err.message;
    } else {
      error = String(err);
    }
  }

  globalThis.postMessage({ events, error });
};

// --- Engine: aubiojs ---
async function detectWithAubio(
  audioBuffer: Float32Array | { getChannelData: (ch: number) => Float32Array },
  sampleRate: number,
  params: any
): Promise<DetectionEvent[]> {
  if (!audioBuffer || !sampleRate) return [];
  if (!aubioModule) {
    aubioModule = await aubio();
  }
  let audioData: Float32Array = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
  const hopSize = params?.hopSize || 512;
  const method = params?.method || 'default';
  let onset = new aubioModule.Onset(method, 1024, hopSize, sampleRate);
  const events: DetectionEvent[] = [];
  let frame = new Float32Array(hopSize);
  let nFrames = Math.floor(audioData.length / hopSize);
  for (let i = 0; i < nFrames; i++) {
    for (let j = 0; j < hopSize; j++) {
      frame[j] = audioData[i * hopSize + j] || 0;
    }
    if (onset.do(frame)) {
      const time = onset.get_last_s();
      events.push({ time });
    }
  }
  return events;
}

// --- Engine: Custom Spectral Flux ---
function detectWithSpectralFlux(
  audioBuffer: Float32Array | { getChannelData: (ch: number) => Float32Array },
  sampleRate: number,
  params: any
): DetectionEvent[] {
  // Simple spectral flux onset detection (single channel)
  if (!audioBuffer || !sampleRate) return [];
  let audioData: Float32Array = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
  const hopSize = params?.hopSize || 512;
  const fftSize = params?.fftSize || 1024;
  // Compute magnitude spectrum for each frame
  const nFrames = Math.floor(audioData.length / hopSize);
  let prevMag: number | null = null;
  const events: DetectionEvent[] = [];
  for (let i = 0; i < nFrames; i++) {
    // Simple energy-based flux (replace with FFT for real spectral flux)
    let frame = audioData.slice(i * hopSize, i * hopSize + hopSize);
    let mag = frame.reduce((sum, v) => sum + Math.abs(v), 0) / hopSize;
    if (prevMag !== null) {
      let flux = mag - prevMag;
      if (flux > 0.05) { // crude threshold
        events.push({ time: (i * hopSize) / sampleRate, strength: flux });
      }
    }
    prevMag = mag;
  }
  return events;
} 