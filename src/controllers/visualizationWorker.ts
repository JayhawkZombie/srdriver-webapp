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
}

interface BandData {
  band: BandDefinition;
  bandIdx: number;
  binIdx: number;
  magnitudes: number[];
  derivatives: number[];
  secondDerivatives: number[];
  impulseStrengths: number[];
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
    const magnitudes = fftSequence.map(row => row[binIdx] ?? 0);
    const derivatives = magnitudes.map((v, i, arr) => i === 0 ? 0 : v - arr[i - 1]);
    const secondDerivatives = derivatives.map((v, i, arr) => i === 0 ? 0 : v - arr[i - 1]);
    const impulseStrengths = secondDerivatives.map((v) => Math.abs(v));
    return {
      band,
      bandIdx,
      binIdx,
      magnitudes,
      derivatives,
      secondDerivatives,
      impulseStrengths,
    };
  });
  // @ts-ignore
  self.postMessage({ bandDataArr } as VisualizationResult);
};

export {}; 