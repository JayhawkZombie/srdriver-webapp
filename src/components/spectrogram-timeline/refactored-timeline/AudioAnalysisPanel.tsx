import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

import { useAppStore } from "../../../store/appStore";
import { workerManager } from "../../../controllers/workerManager";
import {
    decodeAudioFile,
    getMonoPCMData,
} from "../../../controllers/audioChunker";
import Waveform from "./Waveform";
import { ProgressBar } from "@blueprintjs/core";
import { usePlayback } from "./PlaybackContext";
import { WindowedTimeSeriesPlot } from "./WindowedTimeSeriesPlot";
import {
    DetectionDataProvider,
    useDetectionData,
} from "./DetectionDataContext";
import { detectionEngines } from "../../../workers/detectionEngines";
import type { BandConfig } from "./DetectionDataContext";
import { bandpassFilterPCM } from "../../../utility/bandpassFilter";

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

// Helper to render waveform from local state
const WaveformWithLocal = (props: { width: number; height: number; waveform: number[]; duration: number }) => {
  if (!Array.isArray(props.waveform) || props.waveform.length === 0) return null;
  return <Waveform width={props.width} height={props.height} waveform={props.waveform} duration={props.duration} />;
};

// Example band definitions (industry-standard splits)
const BAND_DEFS = [
  { name: "Sub Bass", freq: 60, color: "#2b8cbe" },      // 20–60 Hz
  { name: "Bass", freq: 120, color: "#41ab5d" },         // 60–250 Hz
  { name: "Low Mid", freq: 400, color: "#fdae6b" },      // 250–500 Hz
  { name: "Mid", freq: 1000, color: "#d94801" },         // 500–2k Hz
  { name: "High", freq: 4000, color: "#756bb1" },        // 2k–6k Hz
  { name: "Presence", freq: 8000, color: "#f03b20" },    // 6k–20k Hz
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

const FFTSection = ({
    pcm,
    sampleRate,
}: {
    pcm: Float32Array;
    sampleRate: number;
}) => {
    const setFftProgress = useAppStore((s) => s.setFftProgress);
    const setFftResult = useAppStore((s) => s.setFftResult);
    const setBandDataArr = useAppStore((s) => s.setBandDataArr);
    const fftProgress = useAppStore((s) => s.fftProgress);
    const bandDataArr = useAppStore((s) => s.audio.analysis?.bandDataArr);
    const { currentTime } = usePlayback();
    const windowDuration = 15;
    const windowStart = Math.max(0, currentTime - windowDuration / 2);

    const handleRunFFT = () => {
        setFftProgress({ processed: 0, total: 1 });
        workerManager
            .enqueueJob(
                "fft",
                {
                    pcmBuffer: pcm.buffer,
                    windowSize: 1024,
                    hopSize: 512,
                    // No downsampling in worker: get full-res
                },
                (progress) => setFftProgress(progress)
            )
            .then((result: unknown) => {
                const fftResult = result as {
                    fftSequence: number[][];
                    normalizedFftSequence: number[][];
                    summary: Record<string, unknown>;
                };
                // Downsample for Zustand overlays (UI only)
                // const dsFft = downsample2D(fftResult.fftSequence, 200, 64);
                setFftResult({
                    normalizedFftSequence: fftResult.normalizedFftSequence,
                    summary: fftResult.summary,
                });
                const worker = new Worker(
                    new URL(
                        "../../../controllers/visualizationWorker.ts",
                        import.meta.url
                    ),
                    { type: "module" }
                );
                worker.postMessage({
                    fftSequence: fftResult.fftSequence,
                    bands: BAND_DEFS,
                    sampleRate,
                    hopSize: 512,
                });
                worker.onmessage = (
                    e: MessageEvent<{ bandDataArr: BandData[] }>
                ) => {
                    setBandDataArr(e.data.bandDataArr);
                    worker.terminate();
                };
            });
    };

    return (
        <div style={{ marginTop: 32 }}>
            <h4>FFT Analysis (Store-Driven, Full-Res Local State)</h4>
            <button onClick={handleRunFFT}>Run FFT</button>
            {fftProgress &&
                fftProgress.total > 0 &&
                fftProgress.processed < fftProgress.total && (
                    <ProgressBar
                        animate
                        stripes
                        value={fftProgress.processed / fftProgress.total}
                        style={{ margin: "16px 0", height: 10 }}
                    />
                )}
            {/* Band overlays from Zustand (summary only) */}
            {bandDataArr && bandDataArr.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h5>Band Overlays (First 15s, with Impulse Markers)</h5>
                    {bandDataArr.map((band, i) => {
                        const label = BAND_LABELS[i] || {
                            name: `Band ${i + 1}`,
                            color: "#4fc3f7",
                        };
                        const hopSize = 512; // default, update if dynamic
                        const sampleRate = 48000; // default, update if dynamic
                        const frames15s = Math.floor(
                            (15 * sampleRate) / hopSize
                        );
                        const data = band.magnitudes.slice(0, frames15s);
                        const impulses = band.sustainedImpulses
                            ? band.sustainedImpulses.slice(0, frames15s)
                            : undefined;
                        // Find indices of impulses > 0
                        const eventTimes = impulses
                            ? (impulses
                                  .map((v, idx) => (v > 0 ? idx : null))
                                  .filter((idx) => idx !== null) as number[])
                            : undefined;
                        return (
                            <div key={i} style={{ marginBottom: 8 }}>
                                <div
                                    style={{ fontSize: 12, color: label.color }}
                                >
                                    {label.name}
                                </div>
                                <WindowedTimeSeriesPlot
                                    yValues={data}
                                    windowStart={windowStart}
                                    windowDuration={windowDuration}
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

const DetectionEngineSection = ({ bands }: { bands: BandConfig[] }) => {
    const {
        results,
        bandResults,
        bandProgress,
        isLoading,
        runDetection,
        error,
    } = useDetectionData();
    const [selectedBand, setSelectedBand] = React.useState(0);
    const { currentTime } = usePlayback();
    const windowDuration = 15;
    const windowStart = Math.max(0, currentTime - windowDuration / 2);
    console.log("selectedBand", selectedBand, bandResults);
    return (
        <div style={{ marginTop: 32 }}>
            <h4>Detection Engine (Context Demo)</h4>
            <button
                onClick={runDetection}
                disabled={bands.length === 0 || isLoading}
            >
                Run Detection
            </button>
            {/* PCM detection plot (always blue) */}
            {results &&
                results.detectionFunction &&
                results.detectionFunction.length > 0 &&
                results.times && (
                    <div style={{ width: 800, height: 100, marginTop: 16 }}>
                        <div
                            style={{
                                color: "#4fc3f7",
                                fontWeight: 500,
                                marginBottom: 4,
                                fontSize: 16,
                            }}
                        >
                            PCM Detection
                        </div>
                        <WindowedTimeSeriesPlot
                            yValues={logNormalize(results.detectionFunction)}
                            xValues={results.times}
                            eventTimes={
                                results.events
                                    ? results.events.map(
                                          (e: {
                                              time: number;
                                              strength?: number;
                                          }) => e.time
                                      )
                                    : undefined
                            }
                            windowStart={windowStart}
                            windowDuration={windowDuration}
                            width={800}
                            height={100}
                            color="#4fc3f7"
                            markerColor="red"
                            showAxes={true}
                            showTicks={true}
                        />
                    </div>
                )}
            {/* Band selection bar and single band plot */}
            {bands.length > 0 && (
                <div style={{ width: 800, marginTop: 16 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {bands.map((band, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedBand(i)}
                                style={{
                                    background:
                                        selectedBand === i
                                            ? band.color
                                            : "transparent",
                                    color:
                                        selectedBand === i
                                            ? "#fff"
                                            : band.color,
                                    border: `1px solid ${band.color}`,
                                    borderRadius: 4,
                                    padding: "4px 12px",
                                    fontWeight:
                                        selectedBand === i ? "bold" : "normal",
                                    cursor: "pointer",
                                    outline: "none",
                                    fontSize: 14,
                                    transition: "background 0.2s, color 0.2s",
                                }}
                            >
                                {band.name}
                            </button>
                        ))}
                    </div>
                    {/* Progress bar for selected band */}
                    {bandProgress[selectedBand] &&
                    bandProgress[selectedBand]!.total > 1 &&
                    bandProgress[selectedBand]!.processed <
                        bandProgress[selectedBand]!.total ? (
                        <ProgressBar
                            animate
                            stripes
                            value={
                                bandProgress[selectedBand]!.processed /
                                bandProgress[selectedBand]!.total
                            }
                            style={{ margin: "8px 0", width: 200, height: 8 }}
                        />
                    ) : isLoading ? (
                        <ProgressBar
                            animate
                            stripes
                            style={{ margin: "8px 0", width: 200, height: 8 }}
                        />
                    ) : null}
                    {/* Only show the selected band's plot */}
                    <div
                        style={{
                            position: "relative",
                            width: 800,
                            height: 120,
                        }}
                    >
                        {bandResults[selectedBand] &&
                            bandResults[selectedBand].detectionFunction &&
                            bandResults[selectedBand].times && (
                                <>
                                    <div
                                        style={{
                                            color: bands[selectedBand].color,
                                            fontWeight: 500,
                                            marginBottom: 4,
                                            fontSize: 16,
                                        }}
                                    >
                                        {bands[selectedBand].name}
                                    </div>
                                    <WindowedTimeSeriesPlot
                                        yValues={logNormalize(
                                            bandResults[selectedBand]
                                                .detectionFunction
                                        )}
                                        xValues={
                                            bandResults[selectedBand].times
                                        }
                                        eventTimes={
                                            bandResults[selectedBand].events
                                                ? bandResults[
                                                      selectedBand
                                                  ].events.map(
                                                      (e: {
                                                          time: number;
                                                          strength?: number;
                                                      }) => e.time
                                                  )
                                                : undefined
                                        }
                                        windowStart={windowStart}
                                        windowDuration={windowDuration}
                                        width={800}
                                        height={100}
                                        color={bands[selectedBand].color}
                                        markerColor="yellow"
                                        showAxes={true}
                                        showTicks={true}
                                    />
                                </>
                            )}
                    </div>
                </div>
            )}
            {error && <div style={{ color: "red" }}>{error}</div>}
        </div>
    );
};

// Context for local audio analysis state
type AudioAnalysisContextType = {
    pcm: Float32Array | null;
    sampleRate: number | null;
    localWaveform: number[] | null;
    localDuration: number | null;
    bandConfigs: BandConfig[];
    filtering: boolean;
    selectedEngine: string;
    engineOptions: string[];
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    progress: { processed: number; total: number; jobId?: string } | null;
    bandDataArr: BandData[];
};

const AudioAnalysisContext = createContext<AudioAnalysisContextType | null>(null);

function useAudioAnalysis() {
    const ctx = useContext(AudioAnalysisContext);
    if (!ctx) throw new Error("useAudioAnalysis must be used within AudioAnalysisProvider");
    return ctx;
}

type AudioAnalysisProviderProps = { children: React.ReactNode };

// Helper type guard for waveform result
function isWaveformResult(result: unknown): result is { waveform: number[]; duration: number; type: string } {
    return (
        typeof result === 'object' &&
        result !== null &&
        'type' in result &&
        (result as { type: string }).type === 'waveformResult' &&
        Array.isArray((result as { waveform?: unknown }).waveform)
    );
}

function AudioAnalysisProvider({ children }: AudioAnalysisProviderProps) {
    // Local state (was in AudioAnalysisPanel)
    const setAudioData = useAppStore((s) => s.setAudioData);
    const setWaveformProgress = useAppStore((s) => s.setWaveformProgress);
    const progress = useAppStore((s) => s.waveformProgress);
    const bandDataArr = (useAppStore((s) => s.audio.analysis?.bandDataArr) || []) as BandData[];
    const engineOptions = Object.keys(detectionEngines);
    const [pcm, setPcm] = useState<Float32Array | null>(null);
    const [sampleRate, setSampleRate] = useState<number | null>(null);
    const [localWaveform, setLocalWaveform] = useState<number[] | null>(null);
    const [localDuration, setLocalDuration] = useState<number | null>(null);
    const [selectedEngine, setSelectedEngine] = useState<string>(engineOptions[0]);
    const [bandConfigs, setBandConfigs] = useState<BandConfig[]>([]);
    const [filtering, setFiltering] = useState<boolean>(false);

    // Band filtering effect
    useEffect(() => {
        if (!pcm || !sampleRate || !bandDataArr || bandDataArr.length === 0)
            return;
        setFiltering(true);
        Promise.all(
            bandDataArr.map(async (band, i) => ({
                name: BAND_LABELS[i]?.name || `Band ${i + 1}`,
                pcm: await bandpassFilterPCM(
                    pcm,
                    sampleRate,
                    BAND_DEFS[i]?.freq || 1000,
                    1
                ), // Q=1, adjust as needed
                color: BAND_COLORS[i % BAND_COLORS.length],
            }))
        ).then((configs: BandConfig[]) => {
            setBandConfigs(configs);
            setFiltering(false);
        });
    }, [pcm, sampleRate, bandDataArr]);

    // File change handler
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        const audioBuffer = await decodeAudioFile(file);
        const pcmData = getMonoPCMData(audioBuffer);
        setPcm(pcmData);
        setSampleRate(audioBuffer.sampleRate);
        setWaveformProgress({ processed: 0, total: 1000 });
        workerManager
            .enqueueJob(
                "waveform",
                {
                    type: "waveform",
                    pcmBuffer: pcmData.buffer,
                    sampleRate: audioBuffer.sampleRate,
                    numPoints: 1000,
                },
                (progress) => setWaveformProgress(progress)
            )
            .then((result) => {
                if (isWaveformResult(result)) {
                    setLocalWaveform(result.waveform);
                    setLocalDuration(audioBuffer.duration);
                    setAudioData({
                        waveform: result.waveform.slice(0, 1000),
                        duration: audioBuffer.duration,
                    }); // Store only summary in Zustand
                    setWaveformProgress(null);
                }
            });
    }, [setAudioData, setWaveformProgress]);

    const value: AudioAnalysisContextType = {
        pcm,
        sampleRate,
        localWaveform,
        localDuration,
        bandConfigs,
        filtering,
        selectedEngine,
        engineOptions,
        handleFileChange,
        progress,
        bandDataArr,
    };
    return (
        <AudioAnalysisContext.Provider value={value}>
            {children}
        </AudioAnalysisContext.Provider>
    );
}

export { AudioAnalysisProvider, useAudioAnalysis };

// Replace the default export function with the provider wrapping the panel
export default function AudioAnalysisPanel() {
    return (
        <AudioAnalysisProvider>
            <AudioAnalysisPanelInner />
        </AudioAnalysisProvider>
    );
}

// Move the original AudioAnalysisPanel implementation to AudioAnalysisPanelInner
function AudioAnalysisPanelInner() {
    // All state and handlers now come from context
    const {
        pcm,
        sampleRate,
        localWaveform,
        localDuration,
        bandConfigs,
        filtering,
        selectedEngine,
        engineOptions,
        handleFileChange,
        progress,
        bandDataArr,
    } = useAudioAnalysis();
    return (
        <div style={{ maxWidth: 800, margin: "2rem auto", padding: 16 }}>
            <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
            />
            {progress &&
                progress.total > 0 &&
                progress.processed < progress.total && (
                    <ProgressBar
                        animate
                        stripes
                        value={progress.processed / progress.total}
                        style={{ margin: "16px 0", height: 10 }}
                    />
                )}
            {localWaveform && localDuration && (
                <WaveformWithLocal
                    width={800}
                    height={80}
                    waveform={localWaveform}
                    duration={localDuration}
                />
            )}
            {pcm && sampleRate && (
                <FFTSection pcm={pcm} sampleRate={sampleRate} />
            )}
            {pcm && sampleRate && (
                <div>
                    <div
                        style={{ display: "flex", gap: 8, marginBottom: 8 }}
                    >
                        <span style={{ fontWeight: 500, marginRight: 8 }}>
                            Engine:
                        </span>
                        {engineOptions.map((eng) => (
                            <button
                                key={eng}
                                onClick={() => setSelectedEngine(eng)}
                                disabled={selectedEngine === eng}
                                style={{
                                    background:
                                        selectedEngine === eng
                                            ? "#333"
                                            : "transparent",
                                    color:
                                        selectedEngine === eng
                                            ? "#fff"
                                            : "#333",
                                    border: "1px solid #333",
                                    borderRadius: 4,
                                    padding: "4px 12px",
                                    fontWeight:
                                        selectedEngine === eng
                                            ? "bold"
                                            : "normal",
                                    cursor:
                                        selectedEngine === eng
                                            ? "default"
                                            : "pointer",
                                    marginRight: 4,
                                    outline: "none",
                                    fontSize: 14,
                                    transition:
                                        "background 0.2s, color 0.2s",
                                    opacity:
                                        selectedEngine === eng ? 1 : 0.8,
                                }}
                            >
                                {eng}
                            </button>
                        ))}
                    </div>
                    {filtering ? (
                        <div style={{ margin: "16px 0", color: "#888" }}>
                            Filtering bands...
                        </div>
                    ) : (
                        bandConfigs.length > 0 && (
                            <DetectionDataProvider
                                engine={selectedEngine}
                                pcm={pcm}
                                sampleRate={sampleRate}
                                bands={bandConfigs}
                            >
                                <DetectionEngineSection
                                    bands={bandConfigs}
                                />
                            </DetectionDataProvider>
                        )
                    )}
                </div>
            )}
        </div>
    );
} 

