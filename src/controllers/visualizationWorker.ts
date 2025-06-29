// visualizationWorker.ts - Web Worker for per-band audio visualization math

// Types for messages
interface BandDefinition {
  name: string;
  freq: number;
  color: string;
}

interface VisualizationRequest {
  fftSequence: number[][]; // Array of arrays (Float32Array not transferable)
  bands: BandDefinition[];
  sampleRate: number;
  hopSize: number;
  impulseWindowSize?: number;
  impulseSmoothing?: number;
  impulseDetectionMode?: 'second-derivative' | 'first-derivative' | 'z-score';
}

interface BandData {
  band: BandDefinition;
  bandIdx: number;
  binIdx: number;
  magnitudes: number[];
  derivatives: number[];
  secondDerivatives: number[];
  impulseStrengths: number[];
  normalizedImpulseStrengths: number[];
}

interface VisualizationResult {
  bandDataArr: BandData[];
}

// If DedicatedWorkerGlobalScope is not defined, declare a minimal fallback type (for TypeScript in web workers)
// @ts-ignore
type _DedicatedWorkerGlobalScope = typeof globalThis & { onmessage: (e: MessageEvent) => void; postMessage: (msg: any) => void; };
// @ts-ignore
declare var self: _DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent) => {
  const data = e.data as VisualizationRequest;
  const { fftSequence, bands, sampleRate, hopSize } = data;
  const impulseWindowSize = Math.max(1, data.impulseWindowSize || 1);
  const impulseSmoothing = Math.max(1, data.impulseSmoothing || 1);
  const impulseDetectionMode = data.impulseDetectionMode || 'second-derivative';
  const numBins = fftSequence[0]?.length || 0;
  // Compute frequency for each bin
  const freqs = Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins));
  const bandDataArr: BandData[] = bands.map((band, bandIdx) => {
    // Find the bin closest to the band's frequency
    let binIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < freqs.length; i++) {
      const diff = Math.abs(freqs[i] - band.freq);
      if (diff < minDiff) {
        minDiff = diff;
        binIdx = i;
      }
    }
    // Get raw magnitudes
    let magnitudes = fftSequence.map(row => row[binIdx] ?? 0);
    // Smoothing (moving average) if requested
    if (impulseSmoothing > 1) {
      magnitudes = movingAverage(magnitudes, impulseSmoothing);
    }
    // Derivative helpers
    function nthDerivative(arr: number[], n: number, window: number): number[] {
      if (n <= 0) return arr.slice();
      let result = arr.slice();
      for (let d = 0; d < n; d++) {
        result = result.map((v, i, a) => i < window ? 0 : v - a[i - window]);
      }
      return result;
    }
    // Compute derivatives based on mode and window size
    let derivatives: number[] = nthDerivative(magnitudes, 1, impulseWindowSize);
    let secondDerivatives: number[] = nthDerivative(magnitudes, 2, impulseWindowSize);
    let impulseStrengths: number[] = [];
    if (impulseDetectionMode === 'second-derivative') {
      impulseStrengths = secondDerivatives.map(Math.abs);
    } else if (impulseDetectionMode === 'first-derivative') {
      impulseStrengths = derivatives.map(Math.abs);
    } else if (impulseDetectionMode === 'z-score') {
      // Z-score of first derivative
      const mean = derivatives.reduce((a, b) => a + b, 0) / derivatives.length;
      const std = Math.sqrt(derivatives.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / derivatives.length) || 1;
      impulseStrengths = derivatives.map(v => (v - mean) / std);
    }
    // Normalization for UI thresholding
    const mean = impulseStrengths.reduce((a, b) => a + b, 0) / impulseStrengths.length;
    const std = Math.sqrt(impulseStrengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / impulseStrengths.length) || 1;
    const normalizedImpulseStrengths = impulseStrengths.map(v => (v - mean) / std);
    // Debug: log values for the first band
    if (bandIdx === 0) {
      console.log('[visualizationWorker] Band:', band.name);
      console.log('  magnitudes:', magnitudes.slice(0, 20));
      console.log('  derivatives:', derivatives.slice(0, 20));
      console.log('  secondDerivatives:', secondDerivatives.slice(0, 20));
      console.log('  impulseStrengths:', impulseStrengths.slice(0, 20));
      console.log('  normalizedImpulseStrengths:', normalizedImpulseStrengths.slice(0, 20));
    }
    return {
      band,
      bandIdx,
      binIdx,
      magnitudes,
      derivatives,
      secondDerivatives,
      impulseStrengths,
      normalizedImpulseStrengths,
    };
  });
  // @ts-ignore
  self.postMessage({ bandDataArr } as VisualizationResult);
};

// Helper: moving average smoothing
function movingAverage(arr: number[], window: number): number[] {
  if (window <= 1) return arr.slice();
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      sum += arr[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

export {}; 