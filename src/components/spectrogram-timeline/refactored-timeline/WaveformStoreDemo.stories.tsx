import React from "react";
import { useAppStore } from "../../../store/appStore";
import type { DetectionEvent } from "../../../store/appStore";
import { workerManager } from "../../../controllers/workerManager";
import { decodeAudioFile, getMonoPCMData } from '../../../controllers/audioChunker';
import Waveform from "./Waveform";
import { ProgressBar } from "@blueprintjs/core";
import { PlaybackProvider } from "./PlaybackContext";
import TimeSeriesPlotWithEvents from "./TimeSeriesPlotWithEvents";

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

const FFTSection = ({ pcm, sampleRate }: { pcm: Float32Array; sampleRate: number }) => {
  const setFftProgress = useAppStore((s) => s.setFftProgress);
  const setFftResult = useAppStore((s) => s.setFftResult);
  const setBandDataArr = useAppStore((s) => s.setBandDataArr);
  const fftProgress = useAppStore((s) => s.fftProgress);
  const bandDataArr = useAppStore((s) => s.audio.analysis?.bandDataArr);
  // Local state for full-res FFT (add back if needed for advanced overlays)
  console.log('FFTSection', bandDataArr);

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
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: label.color }}>{label.name}</div>
                <TimeSeriesPlotWithEvents
                  yValues={data}
                  // No xValues, use index
                  eventTimes={impulses && impulses.length > 0 ? impulses.map((v, idx) => v > 0 ? idx : null).filter(idx => idx !== null) as number[] : undefined}
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

const AubioSection = ({ pcm, sampleRate }: { pcm: Float32Array; sampleRate: number }) => {
  const setAubioProgress = useAppStore((s) => s.setAubioProgress);
  const aubioProgress = useAppStore((s) => s.aubioProgress);
  // Local state for full-res Aubio results
  const [detectionFunction, setDetectionFunction] = React.useState<number[] | null>(null);
  const [detectionTimes, setDetectionTimes] = React.useState<number[] | null>(null);
  const [aubioEvents, setAubioEvents] = React.useState<DetectionEvent[] | null>(null);
  const [aubioError, setAubioError] = React.useState<string | undefined>(undefined);
  console.log('AubioSection', detectionFunction, detectionTimes, aubioEvents);

  const handleRunAubio = () => {
    console.log('handleRunAubio', { pcm, sampleRate });
    setAubioProgress({ processed: 0, total: 1 });
    workerManager.enqueueJob(
      'aubio',
      {
        audioBuffer: pcm,
        sampleRate,
        engine: 'aubio',
      },
      (progress) => setAubioProgress(progress)
    ).then((result: unknown) => {
      const aubioResult = result as { detectionFunction: number[]; times: number[]; events: DetectionEvent[]; error?: string };
      setDetectionFunction(aubioResult.detectionFunction);
      setDetectionTimes(aubioResult.times);
      setAubioEvents(aubioResult.events);
      setAubioError(aubioResult.error);
      setAubioProgress(null);
    });
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h4>Aubio Detection (Local State)</h4>
      <button onClick={handleRunAubio}>Run Aubio Detection</button>
      {aubioProgress && aubioProgress.total > 0 && aubioProgress.processed < aubioProgress.total && (
        <ProgressBar
          animate
          stripes
          value={aubioProgress.processed / aubioProgress.total}
          style={{ margin: '16px 0', height: 10 }}
        />
      )}
      {detectionFunction && detectionFunction.length > 0 && detectionTimes && (
        <div style={{ width: 800, height: 100 }}>
          <TimeSeriesPlotWithEvents
            yValues={detectionFunction}
            xValues={detectionTimes}
            eventTimes={aubioEvents ? aubioEvents.map(e => e.time) : undefined}
            width={800}
            height={100}
            color="#4fc3f7"
            markerColor="red"
          />
        </div>
      )}
      {aubioError && <div style={{ color: 'red' }}>{aubioError}</div>}
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
        {pcm && sampleRate && <AubioSection pcm={pcm} sampleRate={sampleRate} />}
      </div>
    </PlaybackProvider>
  );
}; 