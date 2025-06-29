// @ts-nocheck
/* eslint-disable */
// Pluggable audio worker for onset/impulse detection (browser-compatible)
// Supports multiple engines: 'aubio', 'spectral-flux', etc.
importScripts('https://cdn.jsdelivr.net/npm/aubiojs@latest/dist/aubio.js');
import { DetectionEvent } from './types';

let aubioModule = null;

onmessage = async (e) => {
  const { audioBuffer, sampleRate, params = {}, engine = 'spectral-flux' } = e.data;
  let events = [];
  let error = null;

  try {
    if (engine === 'aubio') {
      events = await detectWithAubio(audioBuffer, sampleRate, params);
    } else if (engine === 'spectral-flux') {
      events = detectWithSpectralFlux(audioBuffer, sampleRate, params);
    } else {
      error = 'Unknown engine: ' + engine;
    }
  } catch (e) {
    error = e.message || String(e);
  }

  postMessage({ events, error });
};

// --- Engine: aubiojs ---
async function detectWithAubio(audioBuffer, sampleRate, params) {
  if (!audioBuffer || !sampleRate) return [];
  if (!aubioModule) {
    aubioModule = await aubio();
  }
  let audioData = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
  const hopSize = params?.hopSize || 512;
  const method = params?.method || 'default';
  let onset = new aubioModule.Onset(method, 1024, hopSize, sampleRate);
  const events = [];
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
function detectWithSpectralFlux(audioBuffer, sampleRate, params) {
  // Simple spectral flux onset detection (single channel)
  if (!audioBuffer || !sampleRate) return [];
  let audioData = audioBuffer instanceof Float32Array ? audioBuffer : audioBuffer.getChannelData(0);
  const hopSize = params?.hopSize || 512;
  const fftSize = params?.fftSize || 1024;
  // Compute magnitude spectrum for each frame
  const nFrames = Math.floor(audioData.length / hopSize);
  let prevMag = null;
  const events = [];
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