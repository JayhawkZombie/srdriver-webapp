// bandFilterWorker.ts - Web Worker for bandpass filtering (Vite-compatible)

interface BandDef {
  name: string;
  freq: number;
  q: number;
  color: string;
}

interface BandFilterRequest {
  pcmBuffer: ArrayBuffer;
  sampleRate: number;
  bands: BandDef[];
  jobId?: string;
}

interface BandFilterResult {
  type: 'done';
  bands: { name: string; color: string; pcm: number[] }[];
  jobId?: string;
}

// Simple Biquad bandpass filter (Direct Form 1)
function biquadBandpass(
  input: Float32Array,
  sampleRate: number,
  freq: number,
  q: number
): Float32Array {
  const w0 = 2 * Math.PI * freq / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;
  // Normalize
  const normB0 = b0 / a0;
  const normB1 = b1 / a0;
  const normB2 = b2 / a0;
  const normA1 = a1 / a0;
  const normA2 = a2 / a0;
  const out = new Float32Array(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = normB0 * x0 + normB1 * x1 + normB2 * x2 - normA1 * y1 - normA2 * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

self.onmessage = async (e: MessageEvent) => {
  const data = e.data as BandFilterRequest;
  self.postMessage({ type: 'log', message: '[bandFilterWorker] received request', bands: data.bands, sampleRate: data.sampleRate, pcmLength: data.pcmBuffer.byteLength });
  const pcm = new Float32Array(data.pcmBuffer);
  const bands = data.bands;
  const total = bands.length;
  const resultBands: { name: string; color: string; pcm: number[] }[] = [];
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    self.postMessage({ type: 'log', message: `[bandFilterWorker] filtering band ${band.name}`, band });
    const filtered = biquadBandpass(pcm, data.sampleRate, band.freq, band.q);
    self.postMessage({ type: 'log', message: `[bandFilterWorker] finished band ${band.name}`, band, filteredPreview: Array.from(filtered.slice(0, 8)) });
    resultBands.push({ name: band.name, color: band.color, pcm: Array.from(filtered) });
    self.postMessage({ type: 'progress', processed: i + 1, total, jobId: data.jobId });
  }
  const result: BandFilterResult = { type: 'done', bands: resultBands, jobId: data.jobId };
  self.postMessage({ type: 'log', message: '[bandFilterWorker] posting final result', resultPreview: { bands: resultBands.map(b => ({ name: b.name, color: b.color, pcmLen: b.pcm.length })) } });
  self.postMessage(result);
}; 