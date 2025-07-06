import React from "react";
import { useAppStore } from "../../../store/appStore";
import { workerManager } from "../../../controllers/workerManager";
import { decodeAudioFile, getMonoPCMData } from '../../../controllers/audioChunker';
import Waveform from "./Waveform";
import { ProgressBar } from "@blueprintjs/core";
import { PlaybackProvider } from "./PlaybackContext";
import { WindowedTimeSeriesPlot } from "./WindowedTimeSeriesPlot";
import { detectionEngines } from "../../../workers/detectionEngines";

// BandData type (inline, matching worker output)
type BandData = {
  band: { name: string; color: string };
  bandIdx: number;
  binIdx: number;
  magnitudes: number[];
  derivatives: number[];
  secondDerivatives: number[];
  impulseStrengths: number[];
  normalizedImpulseStrengths: number[];
  detectionFunction?: number[];
  threshold?: number[];
  sustainedImpulses?: number[];
  detectionTimes?: number[];
};

export default {
  title: "RefactoredTimeline/WaveformStoreDemo",
};

// Helper to render waveform from local state
const WaveformWithLocal = (props: { width: number; height: number; waveform: number[]; duration: number }) => {
  if (!Array.isArray(props.waveform) || props.waveform.length === 0) return null;
  return <Waveform width={props.width} height={props.height} waveform={props.waveform} duration={props.duration} />;
};

// Example band definitions (bass, mid, treble)
const BAND_DEFS = [
  { name: "Bass", freq: 60, color: "#2b8cbe" },
  { name: "Mid", freq: 1000, color: "#a6bddb" },
  { name: "Treble", freq: 8000, color: "#f03b20" },
];

// 5-band definitions (example splits)
const BAND_LABELS = [
  { name: "Bass", color: "#2b8cbe" },
  { name: "Low Mid", color: "#41ab5d" },
  { name: "Mid", color: "#fdae6b" },
  { name: "High Mid", color: "#d94801" },
  { name: "Treble", color: "#756bb1" },
];

// Utility: band colors for up to 5 bands
const BAND_COLORS = ["#2b8cbe", "#41ab5d", "#fdae6b", "#d94801", "#756bb1"];

// Utility: log-normalize an array for plotting
function logNormalize(arr: number[]): number[] {
  const logArr = arr.map(v => Math.log10(Math.abs(v) + 1e-6));
  const min = Math.min(...logArr);
  const max = Math.max(...logArr);
  return logArr.map(v => (max - min > 0 ? (v - min) / (max - min) : 0.5));
}

const FFTSection = ({ pcm, sampleRate }: { pcm: Float32Array; sampleRate: number }) => {
  const setFftProgress = useAppStore((s) => s.setFftProgress);
  const setFftResult = useAppStore((s) => s.setFftResult);
  const setBandDataArr = useAppStore((s) => s.setBandDataArr);
  const fftProgress = useAppStore((s) => s.fftProgress);
  const bandDataArr = useAppStore((s) => s.audio.analysis?.bandDataArr);
  // Local state for full-res FFT (add back if needed for advanced overlays)

  const handleRunFFT = () => {
    setFftProgress({ processed: 0, total: 1 });
    workerManager.enqueueJob(
      'fft',
      {
        pcmBuffer: pcm.buffer,
        windowSize: 1024,
        hopSize: 512,
        // No downsampling in worker: get full-res
      },
      (progress) => setFftProgress(progress)
    ).then((result: unknown) => {
      const fftResult = result as { fftSequence: number[][]; normalizedFftSequence: number[][]; summary: Record<string, unknown> };
      // Downsample for Zustand overlays (UI only)
      // const dsFft = downsample2D(fftResult.fftSequence, 200, 64);
      setFftResult({
        normalizedFftSequence: fftResult.normalizedFftSequence,
        summary: fftResult.summary,
      });
      const worker = new Worker(new URL("../../../controllers/visualizationWorker.ts", import.meta.url), { type: "module" });
      worker.postMessage({
        fftSequence: fftResult.fftSequence,
        bands: BAND_DEFS,
        sampleRate,
        hopSize: 512,
      });
      worker.onmessage = (e: MessageEvent<{ bandDataArr: BandData[] }>) => {
        setBandDataArr(e.data.bandDataArr);
        worker.terminate();
      };
    });
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h4>FFT Analysis (Store-Driven, Full-Res Local State)</h4>
      <button onClick={handleRunFFT}>Run FFT</button>
      {fftProgress && fftProgress.total > 0 && fftProgress.processed < fftProgress.total && (
        <ProgressBar
          animate
          stripes
          value={fftProgress.processed / fftProgress.total}
          style={{ margin: '16px 0', height: 10 }}
        />
      )}
      {/* Band overlays from Zustand (summary only) */}
      {bandDataArr && bandDataArr.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h5>Band Overlays (First 15s, with Impulse Markers)</h5>
          {bandDataArr.map((band, i) => {
            const label = BAND_LABELS[i] || { name: `Band ${i+1}`, color: "#4fc3f7" };
            const hopSize = 512; // default, update if dynamic
            const sampleRate = 48000; // default, update if dynamic
            const frames15s = Math.floor((15 * sampleRate) / hopSize);
            const data = band.magnitudes.slice(0, frames15s);
            const impulses = band.sustainedImpulses ? band.sustainedImpulses.slice(0, frames15s) : undefined;
            // Find indices of impulses > 0
            const eventTimes = impulses ? impulses.map((v, idx) => v > 0 ? idx : null).filter(idx => idx !== null) as number[] : undefined;
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: label.color }}>{label.name}</div>
                <WindowedTimeSeriesPlot
                  yValues={data}
                  windowStart={0}
                  windowDuration={frames15s}
                  eventTimes={eventTimes}
                  width={800}
                  height={32}
                  color={label.color}
                  markerColor="yellow"
                />
              </div>
            );
          })}
        </div>
      )}
      {/* Optionally, advanced overlays using fullResFft here */}
    </div>
  );
};

const DetectionEngineSection = ({ pcm, sampleRate }: { pcm: Float32Array; sampleRate: number }) => {
  const [engineKey, setEngineKey] = React.useState<string>('aubio');
  const [result, setResult] = React.useState<null | { detectionFunction: number[]; times: number[]; events: { time: number; strength?: number }[]; error?: string }>(null);
  const [bandResults, setBandResults] = React.useState<null | Array<{ detectionFunction: number[]; times: number[]; events: { time: number; strength?: number }[]; bandIdx: number }>>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const engineOptions = Object.keys(detectionEngines);
  const bandDataArr = useAppStore((s) => s.audio.analysis?.bandDataArr);

  const handleRunDetection = async () => {
    setIsLoading(true);
    setError(undefined);
    setResult(null);
    setBandResults(null);
    try {
      const engine = detectionEngines[engineKey];
      if (!engine) throw new Error('Engine not found');
      // Run on full PCM
      const res = await engine.detect(pcm, sampleRate, {}, undefined);
      // Memoize log-normalized detection function for PCM
      const normRes = {
        ...res,
        detectionFunction: logNormalize(res.detectionFunction)
      };
      setResult(normRes);
      // Run on each band if available
      if (bandDataArr && bandDataArr.length > 0) {
        // For each band, run detection on band.magnitudes (convert to Float32Array)
        const bandPromises = bandDataArr.map(async (band, i) => {
          const bandPcm = Float32Array.from(band.magnitudes);
          const bandRes = await engine.detect(bandPcm, sampleRate, {}, undefined);
          // Memoize log-normalized detection function for each band
          return { ...bandRes, detectionFunction: logNormalize(bandRes.detectionFunction), bandIdx: i };
        });
        const allBandResults = await Promise.all(bandPromises);
        setBandResults(allBandResults);
      }
      setIsLoading(false);
    } catch (e: unknown) {
      let message = 'Error running detection';
      if (isErrorWithMessage(e)) {
        message = e.message;
      }
      setError(message);
      setIsLoading(false);
    }
  };

  // Windowing example: show first 15s
  const windowStart = 0;
  const windowDuration = 15;

  return (
    <div style={{ marginTop: 32 }}>
      <h4>Detection Engine (Local State)</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <label htmlFor="engine-select">Engine:</label>
        <select id="engine-select" value={engineKey} onChange={e => setEngineKey(e.target.value)}>
          {engineOptions.map(key => <option key={key} value={key}>{key}</option>)}
        </select>
        <button onClick={handleRunDetection}>Run Detection</button>
      </div>
      {/* Always show spinner when loading */}
      {isLoading && (
        <ProgressBar animate stripes style={{ margin: '16px 0', height: 10 }} />
      )}
      {result && result.detectionFunction && result.detectionFunction.length > 0 && result.times && (
        <div style={{ width: 800, height: 100 }}>
          <WindowedTimeSeriesPlot
            yValues={result.detectionFunction}
            xValues={result.times}
            eventTimes={result.events ? result.events.map(e => e.time) : undefined}
            windowStart={windowStart}
            windowDuration={windowDuration}
            width={800}
            height={100}
            color="#4fc3f7"
            markerColor="red"
          />
        </div>
      )}
      {/* Show all band detection results on the same plot */}
      {bandResults && bandResults.length > 0 && (
        <div style={{ width: 800, height: 120, marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
            {bandResults.map((r, i) => (
              <span key={i} style={{ color: BAND_COLORS[r.bandIdx % BAND_COLORS.length], fontSize: 12 }}>
                {BAND_LABELS[r.bandIdx]?.name || `Band ${r.bandIdx+1}`}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', width: 800, height: 100 }}>
            {bandResults.map((r, i) => (
              <div key={i} style={{ position: 'absolute', left: 0, top: 0, width: 800, height: 100, pointerEvents: 'none' }}>
                <WindowedTimeSeriesPlot
                  yValues={r.detectionFunction}
                  xValues={r.times}
                  eventTimes={r.events ? r.events.map(e => e.time) : undefined}
                  windowStart={windowStart}
                  windowDuration={windowDuration}
                  width={800}
                  height={100}
                  color={BAND_COLORS[r.bandIdx % BAND_COLORS.length]}
                  markerColor="yellow"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export const StoreDrivenWaveform = () => {
  const setAudioData = useAppStore((s) => s.setAudioData);
  const setWaveformProgress = useAppStore((s) => s.setWaveformProgress);
  const progress = useAppStore((s) => s.waveformProgress);
  const [pcm, setPcm] = React.useState<Float32Array | null>(null);
  const [sampleRate, setSampleRate] = React.useState<number | null>(null);
  const [localWaveform, setLocalWaveform] = React.useState<number[] | null>(null);
  const [localDuration, setLocalDuration] = React.useState<number | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const audioBuffer = await decodeAudioFile(file);
    const pcmData = getMonoPCMData(audioBuffer);
    setPcm(pcmData);
    setSampleRate(audioBuffer.sampleRate);
    setWaveformProgress({ processed: 0, total: 1000 });
    workerManager.enqueueJob(
      'waveform',
      {
        type: 'waveform',
        pcmBuffer: pcmData.buffer,
        sampleRate: audioBuffer.sampleRate,
        numPoints: 1000,
      },
      (progress) => setWaveformProgress(progress)
    ).then((result) => {
      const r = result as { type: string; waveform?: number[]; duration?: number };
      if (r && r.type === 'waveformResult' && Array.isArray(r.waveform)) {
        setLocalWaveform(r.waveform);
        setLocalDuration(audioBuffer.duration);
        setAudioData({ waveform: r.waveform.slice(0, 1000), duration: audioBuffer.duration }); // Store only summary in Zustand
        setWaveformProgress(null);
      }
    });
  };

  return (
    <PlaybackProvider>
      <div style={{ maxWidth: 800, margin: '2rem auto', padding: 16 }}>
        <h3>Store-Driven Waveform Upload & Progress Demo</h3>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        {progress && progress.total > 0 && progress.processed < progress.total && (
          <ProgressBar
            animate
            stripes
            value={progress.processed / progress.total}
            style={{ margin: '16px 0', height: 10 }}
          />
        )}
        {localWaveform && localDuration && <WaveformWithLocal width={800} height={80} waveform={localWaveform} duration={localDuration} />}
        {pcm && sampleRate && <FFTSection pcm={pcm} sampleRate={sampleRate} />}
        {pcm && sampleRate && <DetectionEngineSection pcm={pcm} sampleRate={sampleRate} />}
      </div>
    </PlaybackProvider>
  );
};

function isErrorWithMessage(e: unknown): e is { message: string } {
  return typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string';
} 