// @ts-nocheck
/* eslint-disable */
// aubio.js Web Worker for onset/impulse detection (browser-compatible)
// Uses the UMD build from CDN via importScripts to avoid Node polyfill issues
// TypeScript and ESLint will complain about importScripts and global aubio, but these are valid in browser workers.
importScripts('https://cdn.jsdelivr.net/npm/aubiojs@latest/dist/aubio.js');
import { DetectionEvent } from './types';

let aubioModule = null;

onmessage = async (e) => {
  const { audioBuffer, sampleRate, params } = e.data;
  if (!audioBuffer || !sampleRate) {
    postMessage({ events: [], error: 'Missing audioBuffer or sampleRate' });
    return;
  }

  // Initialize aubiojs if not already
  if (!aubioModule) {
    try {
      aubioModule = await aubio(); // aubio is now a global from importScripts
    } catch (err) {
      postMessage({ events: [], error: 'Failed to load aubiojs: ' + err });
      return;
    }
  }

  // Convert AudioBuffer to Float32Array if needed
  let audioData;
  if (audioBuffer instanceof Float32Array) {
    audioData = audioBuffer;
  } else if (audioBuffer.getChannelData) {
    // AudioBuffer from Web Audio API
    audioData = audioBuffer.getChannelData(0); // Use first channel
  } else {
    postMessage({ events: [], error: 'audioBuffer must be Float32Array or AudioBuffer' });
    return;
  }

  // Create aubio onset detector
  const hopSize = params?.hopSize || 512;
  const method = params?.method || 'default'; // e.g., 'default', 'energy', 'hfc', 'complex', etc.
  let onset;
  try {
    onset = new aubioModule.Onset(method, 1024, hopSize, sampleRate);
  } catch (err) {
    postMessage({ events: [], error: 'Failed to create aubio onset detector: ' + err });
    return;
  }

  // Run onset detection
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

  postMessage({ events });
}; 