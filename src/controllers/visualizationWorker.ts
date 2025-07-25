// visualizationWorker.ts - Web Worker for per-band audio visualization math (Vite-compatible ES module)

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
  minDb?: number;
  minDbDelta?: number;
  minMagnitudeThreshold?: number;
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
  // For visualization:
  detectionFunction?: number[]; // e.g., spectral flux or derivative
  threshold?: number[]; // adaptive threshold
  sustainedImpulses?: number[]; // 1 if sustained, 0 otherwise
  detectionTimes?: number[]; // times for each frame
}

interface VisualizationResult {
  bandDataArr: BandData[];
}

globalThis.onmessage = (e: MessageEvent) => {
  try {
    console.log('[visualizationWorker] Received message:', e.data);
  const data = e.data as VisualizationRequest;
  const { fftSequence, bands, sampleRate } = data;
    if (!Array.isArray(fftSequence) || fftSequence.length === 0) {
      console.error('[visualizationWorker] fftSequence is empty or not an array:', fftSequence);
      globalThis.postMessage({ error: 'fftSequence is empty or not an array' });
      return;
    }
    // Log shape and check for NaNs in input
    let nanCount = 0;
    for (let i = 0; i < fftSequence.length; i++) {
      for (let j = 0; j < fftSequence[i].length; j++) {
        if (isNaN(fftSequence[i][j])) nanCount++;
      }
    }
    if (nanCount > 0) {
      console.warn(`[visualizationWorker] WARNING: Found ${nanCount} NaNs in fftSequence input!`);
    } else {
      console.log('[visualizationWorker] fftSequence shape:', fftSequence.length, 'frames x', fftSequence[0].length, 'bins');
    }
  const impulseWindowSize = Math.max(1, data.impulseWindowSize || 1);
  const impulseSmoothing = Math.max(1, data.impulseSmoothing || 1);
  const impulseDetectionMode = data.impulseDetectionMode || 'spectral-flux';
  const derivativeLogDomain = data.derivativeLogDomain !== false; // default true
  const derivativeMode = data.derivativeMode || 'centered'; // default to centered
  const spectralFluxWindow = data.spectralFluxWindow || 21;
  const spectralFluxK = data.spectralFluxK || 2;
  const spectralFluxMinSeparation = data.spectralFluxMinSeparation || 3;
  const minDb = data.minDb ?? -60;
  const minDbDelta = data.minDbDelta ?? 3;
  const minMagnitudeThreshold = data.minMagnitudeThreshold ?? 1e-6;
  const numBins = fftSequence[0]?.length || 0;
  // Compute frequency for each bin
  const freqs = Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins));
  // How many frames must the magnitude stay high to count as sustained? (smaller = less strict)
  const sustainedDuration = 3; // frames for sustained change (was 10)
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
    // Only keep frames with magnitude > minMagnitudeThreshold for impulse/derivative (avoid log(0) and noise)
    const mask = magnitudes.map(m => m > minMagnitudeThreshold ? 1 : 0);
    // Smoothing (moving average) if requested
    if (impulseSmoothing > 1) {
      magnitudes = movingAverage(magnitudes, impulseSmoothing);
    }
    // Compute log-magnitudes if requested
    const procMagnitudes = derivativeLogDomain
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
    const derivatives: number[] = nthDerivative(procMagnitudes, 1, impulseWindowSize, derivativeMode);
    const secondDerivatives: number[] = nthDerivative(procMagnitudes, 2, impulseWindowSize, derivativeMode);
    let impulseStrengths: number[] = [];
    if (impulseDetectionMode === 'spectral-flux') {
      // Spectral flux: positive difference between frames (in log-magnitude domain)
      impulseStrengths = procMagnitudes.map((v, i, a) => i === 0 ? 0 : Math.max(0, v - a[i - 1]));
      // Adaptive thresholding: moving median + k * MAD
      const med = movingMedian(impulseStrengths, spectralFluxWindow);
      const mad = movingMAD(impulseStrengths, spectralFluxWindow, med);
      // Mark impulses where flux > threshold and enforce min separation
      let lastImpulse = -spectralFluxMinSeparation;
      const impulses = new Array(impulseStrengths.length).fill(0);
      const thresholdArr = med.map((m, i) => m + spectralFluxK * mad[i]);
      for (let i = 0; i < impulseStrengths.length; i++) {
        const threshold = thresholdArr[i];
        if (impulseStrengths[i] > threshold && (i - lastImpulse) >= spectralFluxMinSeparation) {
          impulses[i] = impulseStrengths[i];
          lastImpulse = i;
        }
      }
      // Compute sustained impulses: only mark as sustained if magnitude stays above (or below) its value for at least sustainedDuration frames
      const sustainedImpulses = new Array(impulses.length).fill(0);
      for (let i = 0; i < impulses.length; i++) {
        if (
          impulses[i] > 0 &&
          (procMagnitudes[i] * 20 > minDb) &&
          (i === 0 || ((procMagnitudes[i] - procMagnitudes[i - 1]) * 20 > minDbDelta))
        ) {
          let isSustained = true;
          const magVal = magnitudes[i];
          for (let j = 1; j <= sustainedDuration; j++) {
            if (i + j >= magnitudes.length) break;
            if (magnitudes[i + j] < magVal - 1e-6) { // allow small tolerance
              isSustained = false;
              break;
            }
          }
          if (isSustained) sustainedImpulses[i] = impulses[i];
        }
      }
      impulseStrengths = impulses;
      // Compute mean and std for normalization (move this up before use)
      const mean = impulseStrengths.reduce((a, b) => a + b, 0) / impulseStrengths.length;
      const std = Math.sqrt(impulseStrengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / impulseStrengths.length) || 1;
        const detectionFunction = procMagnitudes.map((v, i, a) => i === 0 ? 0 : Math.max(0, v - a[i - 1]));
        const detectionTimes = procMagnitudes.map((_, i) => i * (data.hopSize || 512) / sampleRate);
        const threshold = thresholdArr;
        const sustainedImpulsesComputed = sustainedImpulses;
      return {
        band,
        bandIdx,
        binIdx,
        magnitudes,
        derivatives,
        secondDerivatives,
        impulseStrengths,
        normalizedImpulseStrengths: impulseStrengths.map(v => (v - mean) / std),
          detectionFunction,
          threshold,
          sustainedImpulses: sustainedImpulsesComputed,
          detectionTimes,
      };
    } else if (impulseDetectionMode === 'second-derivative') {
      impulseStrengths = secondDerivatives.map((v, i) => mask[i] ? Math.abs(v) : 0);
      const mean = impulseStrengths.reduce((a, b) => a + b, 0) / impulseStrengths.length;
      const std = Math.sqrt(impulseStrengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / impulseStrengths.length) || 1;
      const normalizedImpulseStrengths = impulseStrengths.map(v => (v - mean) / std);
        const detectionFunction = secondDerivatives;
        const detectionTimes = secondDerivatives.map((_, i) => i * (data.hopSize || 512) / sampleRate);
      return {
        band,
        bandIdx,
        binIdx,
        magnitudes,
        derivatives,
        secondDerivatives,
        impulseStrengths,
        normalizedImpulseStrengths,
          detectionFunction,
          threshold: undefined, // No threshold for second derivative
          sustainedImpulses: undefined, // No sustained impulses for second derivative
          detectionTimes,
      };
    } else if (impulseDetectionMode === 'first-derivative') {
      impulseStrengths = derivatives.map((v, i) => mask[i] ? Math.abs(v) : 0);
      const mean = impulseStrengths.reduce((a, b) => a + b, 0) / impulseStrengths.length;
      const std = Math.sqrt(impulseStrengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / impulseStrengths.length) || 1;
      const normalizedImpulseStrengths = impulseStrengths.map(v => (v - mean) / std);
        const detectionFunction = derivatives;
        const detectionTimes = derivatives.map((_, i) => i * (data.hopSize || 512) / sampleRate);
      return {
        band,
        bandIdx,
        binIdx,
        magnitudes,
        derivatives,
        secondDerivatives,
        impulseStrengths,
        normalizedImpulseStrengths,
          detectionFunction,
          threshold: undefined, // No threshold for first derivative
          sustainedImpulses: undefined, // No sustained impulses for first derivative
          detectionTimes,
      };
    } else if (impulseDetectionMode === 'z-score') {
      // Z-score of first derivative
      const mean = derivatives.reduce((a, b) => a + b, 0) / derivatives.length;
      const std = Math.sqrt(derivatives.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / derivatives.length) || 1;
      impulseStrengths = derivatives.map((v, i) => mask[i] ? (v - mean) / std : 0);
      const zScores = derivatives.map((v, i) => mask[i] ? (v - mean) / std : 0);
      const meanZ = impulseStrengths.reduce((a, b) => a + b, 0) / impulseStrengths.length;
      const stdZ = Math.sqrt(impulseStrengths.reduce((a, b) => a + Math.pow(b - meanZ, 2), 0) / impulseStrengths.length) || 1;
      const normalizedImpulseStrengths = impulseStrengths.map(v => (v - meanZ) / stdZ);
        const detectionFunction = zScores;
        const detectionTimes = zScores.map((_, i) => i * (data.hopSize || 512) / sampleRate);
      return {
        band,
        bandIdx,
        binIdx,
        magnitudes,
        derivatives,
        secondDerivatives,
        impulseStrengths,
        normalizedImpulseStrengths,
          detectionFunction,
          threshold: undefined, // No threshold for z-score
          sustainedImpulses: undefined, // No sustained impulses for z-score
          detectionTimes,
      };
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
        detectionFunction: undefined, // No detection function for default mode
        threshold: undefined, // No threshold for default mode
        sustainedImpulses: undefined, // No sustained impulses for default mode
        detectionTimes: undefined, // No detection times for default mode
    };
  });
    console.log('[visualizationWorker] Computed bandDataArr:', bandDataArr);
  globalThis.postMessage({ bandDataArr } as VisualizationResult);
  } catch (err) {
    console.error('[visualizationWorker] ERROR:', err);
    globalThis.postMessage({ error: String(err) });
  }
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