// audioWorker.ts - Web Worker for audio processing

// Import types and (eventually) processing functions
// import { decodeAudioFile, getMonoPCMData, chunkPCMData } from './audioChunker';
// import { computeFFTMagnitude } from './fftUtils';

// Import FFT for use in the worker
import FFT from 'fft.js';

// Types for messages
interface AudioProcessRequest {
  pcmBuffer: ArrayBuffer; // PCM data as ArrayBuffer
  windowSize: number;
  hopSize: number;
}

interface AudioProcessResult {
  summary: any; // TODO: Replace with proper type
  fftSequence: Float32Array[];
}

// If DedicatedWorkerGlobalScope is not defined, declare a minimal fallback type (for TypeScript in web workers)
// @ts-ignore
type _DedicatedWorkerGlobalScope = typeof globalThis & { onmessage: (e: MessageEvent) => void; postMessage: (msg: any) => void; };
// @ts-ignore
declare var self: _DedicatedWorkerGlobalScope;

// Chunk PCM data
function* chunkPCMData(
  pcmData: Float32Array,
  windowSize: number,
  hopSize: number
): Generator<Float32Array> {
  for (let start = 0; start + windowSize <= pcmData.length; start += hopSize) {
    yield pcmData.subarray(start, start + windowSize);
  }
}

// Compute FFT magnitude (copied from fftUtils, but in worker)
function computeFFTMagnitude(chunk: Float32Array): Float32Array {
  const fft = new FFT(chunk.length);
  const input = new Array(chunk.length).fill(0);
  for (let i = 0; i < chunk.length; i++) input[i] = chunk[i];
  const out = fft.createComplexArray();
  fft.realTransform(out, input);
  fft.completeSpectrum(out);
  const magnitudes = new Float32Array(chunk.length / 2);
  for (let i = 0; i < magnitudes.length; i++) {
    const re = out[2 * i];
    const im = out[2 * i + 1];
    magnitudes[i] = Math.sqrt(re * re + im * im);
  }
  return magnitudes;
}

// Listen for messages from the main thread
self.onmessage = async (e: MessageEvent) => {
  const data = e.data as AudioProcessRequest;
  const pcmData = new Float32Array(data.pcmBuffer);
  let numChunks = 0;
  let firstChunk: Float32Array | null = null;
  let fftSequence: Float32Array[] = [];
  const chunks = Array.from(chunkPCMData(pcmData, data.windowSize, data.hopSize));
  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    numChunks++;
    if (idx === 0) firstChunk = chunk;
    const magnitudes = computeFFTMagnitude(chunk);
    fftSequence.push(magnitudes);
  }
  // Summary (minimal for now)
  const chunkDurationMs = 0; // Not available in worker
  const totalDurationMs = 0; // Not available in worker
  let firstChunkFFT: number[] | undefined = undefined;
  let firstChunkFFTMagnitudes: Float32Array | undefined = undefined;
  if (firstChunk) {
    const magnitudes = computeFFTMagnitude(firstChunk);
    firstChunkFFTMagnitudes = magnitudes;
    firstChunkFFT = Array.from(magnitudes.slice(0, 8));
  }
  const summary = {
    numChunks: chunks.length,
    chunkDurationMs,
    totalDurationMs,
    windowSize: data.windowSize,
    hopSize: data.hopSize,
    firstChunkFFT,
    firstChunkFFTMagnitudes,
  };
  // @ts-ignore
  self.postMessage({ summary, fftSequence } as AudioProcessResult);
};

// No exports (web worker file) 