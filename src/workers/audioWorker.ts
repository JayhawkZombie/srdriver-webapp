// audioWorker.ts - Web Worker for audio processing (Vite-compatible ES module)

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
  jobId?: string;
  maxFrames?: number; // Downsample to this many frames (default 200)
  maxBins?: number;   // Downsample to this many bins (default 64)
}

interface AudioProcessResult {
  summary: Record<string, unknown>; // More specific than any
  fftSequence: number[][];
  normalizedFftSequence: number[][];
  jobId?: string;
}

// (No longer needed: self/globalThis polyfill)

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
    // Normalize by window size (standard practice for audio analysis)
    magnitudes[i] = Math.sqrt(re * re + im * im) / chunk.length;
  }
  return magnitudes;
}

// Listen for messages from the main thread
globalThis.onmessage = async (e: MessageEvent) => {
  const data = e.data as AudioProcessRequest;
  const jobId = data.jobId;
  const pcmData = new Float32Array(data.pcmBuffer);
  let firstChunk: Float32Array | null = null;
  const fftSequence: Float32Array[] = [];
  const chunks = Array.from(chunkPCMData(pcmData, data.windowSize, data.hopSize));
  const totalChunks = chunks.length;
  let lastReportedProcessed = 0;
  console.time('worker-processing');
  for (let idx = 0; idx < totalChunks; idx++) {
    const chunk = chunks[idx];
    if (idx === 0) firstChunk = chunk;
    const magnitudes = computeFFTMagnitude(chunk);
    fftSequence.push(magnitudes);
    // Progress reporting every 500 chunks or on last chunk
    if ((idx % 500 === 0 || idx === totalChunks - 1) && totalChunks > 1) {
      const processed = idx + 1;
      if (processed > lastReportedProcessed) {
        lastReportedProcessed = processed;
        globalThis.postMessage({ type: 'progress', processed, total: totalChunks, timestamp: Date.now(), jobId });
      }
    }
    // Debug log every 1000 chunks
    if (idx % 1000 === 0) {
      console.log(`Worker processed ${idx} of ${totalChunks}`);
    }
  }
  console.timeEnd('worker-processing');
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
    numChunks: totalChunks,
    chunkDurationMs,
    totalDurationMs,
    windowSize: data.windowSize,
    hopSize: data.hopSize,
    firstChunkFFT,
    firstChunkFFTMagnitudes,
  };
  // Debug: log first 3 rows of fftSequence
  console.log('audioWorker.ts: fftSequence (first 3 rows)', fftSequence.slice(0, 3));

  // Compute normalizedFftSequence: log-magnitude normalization to [0,1]
  const normalizedFftSequence = fftSequence.map(frame => {
    return Array.from(frame).map(mag => {
      const logMag = Math.log10(Math.max(1e-8, mag)) + 8; // log scale, shift to [0,8]
      return Math.max(0, Math.min(1, logMag / 8));
    });
  });

  // Downsample 2D array to [maxFrames][maxBins] using averaging
  function downsample2D(arr: number[][], targetFrames: number, targetBins: number): number[][] {
    const srcFrames = arr.length;
    const srcBins = arr[0]?.length || 0;
    if (srcFrames <= targetFrames && srcBins <= targetBins) return arr;
    // Downsample frames
    const frameStep = srcFrames / targetFrames;
    const binStep = srcBins / targetBins;
    const out: number[][] = [];
    for (let i = 0; i < targetFrames; i++) {
      const frameStart = Math.floor(i * frameStep);
      const frameEnd = Math.floor((i + 1) * frameStep);
      // Average over frames
      const frameAvg = Array(targetBins).fill(0);
      let frameCount = 0;
      for (let f = frameStart; f < frameEnd && f < srcFrames; f++) {
        // Downsample bins for this frame
        for (let j = 0; j < targetBins; j++) {
          const binStart = Math.floor(j * binStep);
          const binEnd = Math.floor((j + 1) * binStep);
          let sum = 0, count = 0;
          for (let b = binStart; b < binEnd && b < srcBins; b++) {
            sum += arr[f][b];
            count++;
          }
          frameAvg[j] += count ? sum / count : 0;
        }
        frameCount++;
      }
      // Average across frames
      out.push(frameAvg.map(v => frameCount ? v / frameCount : 0));
    }
    return out;
  }

  // Convert Float32Array[] to number[][] for downsampling
  const fftSeqNum = fftSequence.map(f => Array.from(f));
  const normFftSeqNum = normalizedFftSequence.map(f => Array.from(f));
  const dsFftSeq = downsample2D(fftSeqNum, data.maxFrames ?? 200, data.maxBins ?? 64);
  const dsNormFftSeq = downsample2D(normFftSeqNum, data.maxFrames ?? 200, data.maxBins ?? 64);

  globalThis.postMessage({ type: 'done', summary, fftSequence: dsFftSeq, normalizedFftSequence: dsNormFftSeq, jobId } as AudioProcessResult);
};

// No exports (web worker file) 