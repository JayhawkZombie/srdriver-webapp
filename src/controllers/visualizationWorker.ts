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
  impulseDetectionMode?: 'second-derivative' | 'first-derivative' | 'z-score' | 'spectral-flux';
  derivativeLogDomain?: boolean; // compute derivatives in log domain
  derivativeMode?: 'forward' | 'centered' | 'moving-average'; // NEW: derivative calculation mode
  spectralFluxWindow?: number;
  spectralFluxK?: number;
  spectralFluxMinSeparation?: number;
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
  const impulseDetectionMode = data.impulseDetectionMode || 'spectral-flux';
  const derivativeLogDomain = data.derivativeLogDomain !== false; // default true
  const derivativeMode = data.derivativeMode || 'centered'; // default to centered
  const spectralFluxWindow = data.spectralFluxWindow || 21;
  const spectralFluxK = data.spectralFluxK || 2;
  const spectralFluxMinSeparation = data.spectralFluxMinSeparation || 3;
  const numBins = fftSequence[0]?.length || 0;
  // Compute frequency for each bin
  const freqs = Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins));
  const minImpulseSeparation = 3; // Minimum frames between impulses
  const adaptiveK = 2; // Threshold = median + k * MAD
  // Helper: moving median
  function movingMedian(arr: number[], window: number): number[] {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(arr.length, i + Math.ceil(window / 2));
      const slice = arr.slice(start, end);
      const sorted = [...slice].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      result.push(sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]);
    }
    return result;
  }
  // Helper: median absolute deviation
  function movingMAD(arr: number[], window: number, medians: number[]): number[] {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(arr.length, i + Math.ceil(window / 2));
      const slice = arr.slice(start, end);
      const median = medians[i];
      const deviations = slice.map(x => Math.abs(x - median));
      const sorted = deviations.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      result.push(sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]);
    }
    return result;
  }
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
    // Only keep frames with magnitude > 1e-6 for impulse/derivative (avoid log(0) and noise)
    let mask = magnitudes.map(m => m > 1e-6 ? 1 : 0);
    // Smoothing (moving average) if requested
    if (impulseSmoothing > 1) {
      magnitudes = movingAverage(magnitudes, impulseSmoothing);
    }
    // Compute log-magnitudes if requested
    let procMagnitudes = derivativeLogDomain
      ? magnitudes.map(m => Math.log10(Math.max(m, 1e-8)))
      : magnitudes.slice();
    // Derivative helpers
    /**
     * nthDerivative with selectable mode:
     * - 'forward': arr[i] - arr[i-window] (current - past, default previously)
     * - 'centered': (arr[i+window] - arr[i-window]) / (2*window) (symmetric, best for local slope)
     * - 'moving-average': average of arr[i] - arr[i-1] over window (smoother, lagged)
     */
    function nthDerivative(arr: number[], n: number, window: number, mode: 'forward' | 'centered' | 'moving-average'): number[] {
      if (n <= 0) return arr.slice();
      let result = arr.slice();
      for (let d = 0; d < n; d++) {
        if (mode === 'forward') {
          result = result.map((v, i, a) => i < window ? 0 : v - a[i - window]);
        } else if (mode === 'centered') {
          result = result.map((v, i, a) => {
            if (i < window || i + window >= a.length) return 0;
            return (a[i + window] - a[i - window]) / (2 * window);
          });
        } else if (mode === 'moving-average') {
          result = result.map((v, i, a) => {
            if (i < window) return 0;
            let sum = 0;
            for (let w = 1; w <= window; w++) {
              sum += a[i - w + 1] - a[i - w];
            }
            return sum / window;
          });
        }
      }
      return result;
    }
    // Compute derivatives based on mode and window size
    let derivatives: number[] = nthDerivative(procMagnitudes, 1, impulseWindowSize, derivativeMode);
    let secondDerivatives: number[] = nthDerivative(procMagnitudes, 2, impulseWindowSize, derivativeMode);
    let impulseStrengths: number[] = [];
    if (impulseDetectionMode === 'spectral-flux') {
      // Spectral flux: positive difference between frames (in log-magnitude domain)
      impulseStrengths = procMagnitudes.map((v, i, a) => i === 0 ? 0 : Math.max(0, v - a[i - 1]));
      // Adaptive thresholding: moving median + k * MAD
      const med = movingMedian(impulseStrengths, spectralFluxWindow);
      const mad = movingMAD(impulseStrengths, spectralFluxWindow, med);
      // Mark impulses where flux > threshold and enforce min separation
      let lastImpulse = -minImpulseSeparation;
      let impulses = new Array(impulseStrengths.length).fill(0);
      for (let i = 0; i < impulseStrengths.length; i++) {
        const threshold = med[i] + adaptiveK * mad[i];
        if (impulseStrengths[i] > threshold && (i - lastImpulse) >= spectralFluxMinSeparation) {
          impulses[i] = impulseStrengths[i];
          lastImpulse = i;
        }
      }
      impulseStrengths = impulses;
    } else if (impulseDetectionMode === 'second-derivative') {
      impulseStrengths = secondDerivatives.map((v, i) => mask[i] ? Math.abs(v) : 0);
    } else if (impulseDetectionMode === 'first-derivative') {
      impulseStrengths = derivatives.map((v, i) => mask[i] ? Math.abs(v) : 0);
    } else if (impulseDetectionMode === 'z-score') {
      // Z-score of first derivative
      const mean = derivatives.reduce((a, b) => a + b, 0) / derivatives.length;
      const std = Math.sqrt(derivatives.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / derivatives.length) || 1;
      impulseStrengths = derivatives.map((v, i) => mask[i] ? (v - mean) / std : 0);
    }
    // Normalization for UI thresholding
    const mean = impulseStrengths.reduce((a, b) => a + b, 0) / impulseStrengths.length;
    const std = Math.sqrt(impulseStrengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / impulseStrengths.length) || 1;
    const normalizedImpulseStrengths = impulseStrengths.map(v => (v - mean) / std);
    // Debug: log values for the first band
    if (bandIdx === 0) {
      console.log('[visualizationWorker] Band:', band.name);
      console.log('  magnitudes:', magnitudes.slice(0, 20));
      console.log('  procMagnitudes:', procMagnitudes.slice(0, 20));
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