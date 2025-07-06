import React from "react";
import { useAppStore } from "../../../store/appStore";
import { workerManager } from "../../../controllers/workerManager";
import { decodeAudioFile, getMonoPCMData } from '../../../controllers/audioChunker';
import Waveform from "./Waveform";
import { ProgressBar } from "@blueprintjs/core";
import { PlaybackProvider } from "./PlaybackContext";

export default {
  title: "RefactoredTimeline/WaveformStoreDemo",
};

// Helper to render waveform from Zustand
const WaveformWithStore = (props: { width: number; height: number }) => {
  const waveform = useAppStore((state) => state.audio.analysis?.waveform);
  if (!Array.isArray(waveform) || waveform.length === 0) return null;
  return <Waveform width={props.width} height={props.height} />;
};

const FFTSection = ({ pcm, sampleRate }: { pcm: Float32Array; sampleRate: number }) => {
  const setFftProgress = useAppStore((s) => s.setFftProgress);
  const setFftResult = useAppStore((s) => s.setFftResult);
  const fftProgress = useAppStore((s) => s.fftProgress);
  const normalizedFftSequence = useAppStore((s) => s.audio.analysis?.normalizedFftSequence);

  const handleRunFFT = () => {
    setFftProgress({ processed: 0, total: 1 });
    workerManager.enqueueJob(
      'fft',
      {
        pcmBuffer: pcm.buffer,
        windowSize: 1024,
        hopSize: 512,
      },
      (progress) => setFftProgress(progress)
    ).then((result: any) => {
      setFftResult({
        fftSequence: result.fftSequence,
        normalizedFftSequence: result.normalizedFftSequence,
        summary: result.summary,
      });
      setFftProgress(null);
    });
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h4>FFT Analysis (Store-Driven)</h4>
      <button onClick={handleRunFFT}>Run FFT</button>
      {fftProgress && fftProgress.total > 0 && fftProgress.processed < fftProgress.total && (
        <ProgressBar
          animate
          stripes
          value={fftProgress.processed / fftProgress.total}
          style={{ margin: '16px 0', height: 10 }}
        />
      )}
      {normalizedFftSequence && normalizedFftSequence.length > 0 && (
        <div style={{ overflowX: 'auto', maxWidth: 800 }}>
          {/* Simple heatmap visualization */}
          <div style={{ display: 'flex', flexDirection: 'row', height: 80 }}>
            {normalizedFftSequence.slice(0, 200).map((frame, i) => (
              <div key={i} style={{ width: 2, height: '100%', display: 'inline-block' }}>
                {frame.map((v, j) => (
                  <div
                    key={j}
                    style={{
                      width: '100%',
                      height: 80 / frame.length,
                      background: `rgba(0,0,0,${v})`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AubioSection = ({ pcm, sampleRate }: { pcm: Float32Array; sampleRate: number }) => {
  const setAubioProgress = useAppStore((s) => s.setAubioProgress);
  const setAubioResult = useAppStore((s) => s.setAubioResult);
  const aubioProgress = useAppStore((s) => s.aubioProgress);
  const detectionFunction = useAppStore((s) => s.audio.analysis?.detectionFunction);
  const detectionTimes = useAppStore((s) => s.audio.analysis?.detectionTimes);
  const aubioEvents = useAppStore((s) => s.audio.analysis?.aubioEvents);

  const handleRunAubio = () => {
    setAubioProgress({ processed: 0, total: 1 });
    workerManager.enqueueJob(
      'aubio',
      {
        audioBuffer: pcm,
        sampleRate,
        engine: 'aubio',
      },
      (progress) => setAubioProgress(progress)
    ).then((result: any) => {
      setAubioResult({
        detectionFunction: result.detectionFunction,
        times: result.times,
        events: result.events,
        error: result.error,
      });
      setAubioProgress(null);
    });
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h4>Aubio Detection (Store-Driven)</h4>
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
          {/* Simple detection function plot */}
          <svg width={800} height={100}>
            {detectionFunction.map((v, i) => (
              <rect
                key={i}
                x={(i / detectionFunction.length) * 800}
                y={100 - v * 80}
                width={800 / detectionFunction.length}
                height={v * 80}
                fill={aubioEvents && aubioEvents.find(e => Math.abs(e.time - detectionTimes[i]) < 1e-3) ? 'red' : 'black'}
              />
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

export const StoreDrivenWaveform = () => {
  const setAudioData = useAppStore((s) => s.setAudioData);
  const setWaveformProgress = useAppStore((s) => s.setWaveformProgress);
  const progress = useAppStore((s) => s.waveformProgress);
  const [pcm, setPcm] = React.useState<Float32Array | null>(null);
  const [sampleRate, setSampleRate] = React.useState<number | null>(null);

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
        setAudioData({ waveform: r.waveform, duration: audioBuffer.duration });
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
        <WaveformWithStore width={800} height={80} />
        {pcm && sampleRate && <FFTSection pcm={pcm} sampleRate={sampleRate} />}
        {pcm && sampleRate && <AubioSection pcm={pcm} sampleRate={sampleRate} />}
      </div>
    </PlaybackProvider>
  );
}; 