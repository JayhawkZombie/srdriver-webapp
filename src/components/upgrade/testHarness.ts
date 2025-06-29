// Minimal test harness for aubioWorker
// This can be run in the browser (not Node)
import { DetectionEvent } from './types';

// @ts-ignore
const worker = new Worker(new URL('../../workers/aubioWorker.ts', import.meta.url), { type: 'module' });

worker.onmessage = (e: MessageEvent) => {
  const { events, error } = e.data as { events: DetectionEvent[], error?: string };
  if (error) {
    console.error('aubioWorker error:', error);
  } else {
    console.log('Detected events from aubioWorker:', events);
  }
};

// Load a short audio file and decode it to Float32Array
async function loadAndSendAudio(url: string) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  // Send the first channel as Float32Array
  worker.postMessage({
    audioBuffer: audioBuffer.getChannelData(0),
    sampleRate: audioBuffer.sampleRate,
    params: { hopSize: 512, method: 'default' },
  });
}

// Example: replace with your own test file URL
loadAndSendAudio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/voice-change-o-matic/audio/concert-crowd.ogg');

// To use with real audio data:
// 1. Load an AudioBuffer or Float32Array from a file or microphone
// 2. Pass it to the worker as 'audioBuffer' or 'audioData' 