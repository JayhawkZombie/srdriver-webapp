// waveformWorker.ts - Minimal worker for downsampled waveform extraction
// Types (inline for now, move to types.ts if needed)
interface WaveformRequest {
  type: 'waveform';
  pcmBuffer: ArrayBuffer;
  sampleRate: number;
  numPoints: number;
  jobId?: string;
}

interface WaveformResult {
  type: 'waveformResult';
  waveform: number[]; // min/max pairs, normalized [-1, 1]
  duration: number;
  sampleRate: number;
  jobId?: string;
}

function downsamplePCM(pcm: Float32Array, numPoints: number, jobId?: string): number[] {
  const len = pcm.length;
  const result = [];
  for (let i = 0; i < numPoints; i++) {
    const start = Math.floor((i / numPoints) * len);
    const end = Math.floor(((i + 1) / numPoints) * len);
    let min = 1, max = -1;
    for (let j = start; j < end; j++) {
      const v = pcm[j] || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    result.push(min, max);
    if (i % 100 === 0) {
      console.log(`[WAVEFORM WORKER] posting progress message: ${i} / ${numPoints}`);
      globalThis.postMessage({ type: 'progress', processed: i, total: numPoints, jobId });
    }
  }
  return result;
}

globalThis.onmessage = (e: MessageEvent) => {
  const data = e.data as WaveformRequest;
  if (data.type === 'waveform') {
    const pcm = new Float32Array(data.pcmBuffer);
    const waveform = downsamplePCM(pcm, data.numPoints, data.jobId);
    const duration = pcm.length / data.sampleRate;
    const result: WaveformResult = {
      type: 'waveformResult',
      waveform,
      duration,
      sampleRate: data.sampleRate,
      jobId: data.jobId,
    };
    globalThis.postMessage(result);
  }
}; 