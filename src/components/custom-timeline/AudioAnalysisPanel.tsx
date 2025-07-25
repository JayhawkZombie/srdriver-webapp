import React from "react";

import { useAppStore } from "../../store/appStore";
import { workerManager } from "../../controllers/workerManager";
import Waveform from "./Waveform";
import { ProgressBar } from "@blueprintjs/core";
import { WindowedTimeSeriesPlot } from "./WindowedTimeSeriesPlot";
import {
    useDetectionData,
} from "./DetectionDataContext";
import { useAudioAnalysis } from "./AudioAnalysisContextHelpers";
import type { BandConfig, DetectionResult } from "./DetectionDataTypes";
import { usePlaybackState } from "./PlaybackContext";
import { logNormalize } from "./audioMath";

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

// (Moved logNormalize to audioMath.ts)

const FFTSection = ({
    pcm,
    sampleRate,
    onFftComplete,
}: {
    pcm: Float32Array;
    sampleRate: number;
    onFftComplete: () => void;
}) => {
    const setFftProgress = useAppStore((s) => s.setFftProgress);
    const setFftResult = useAppStore((s) => s.setFftResult);
    const setBandDataArr = useAppStore((s) => s.setBandDataArr);
    const { setPlotReady } = useAudioAnalysis();
    const fftProgress = useAppStore((s) => s.fftProgress);
    const bandDataArr = useAppStore((s) => s.audio.analysis?.bandDataArr);
    const { currentTime } = usePlaybackState();
    const windowDuration = 15;
    const windowStart = Math.max(0, currentTime - windowDuration / 2);

    const handleRunFFT = () => {
        setFftProgress({ processed: 0, total: 1 });
        setPlotReady(false);
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
                console.log("FFTSection: worker result", result);
                if (result && typeof result === 'object' && result !== null) {
                    const r = result as any;
                    // Log types and shapes
                    console.log('fftSequence type:', Array.isArray(r.fftSequence) ? typeof r.fftSequence[0] : typeof r.fftSequence);
                    console.log('fftSequence[0] instanceof Float32Array:', r.fftSequence && r.fftSequence[0] instanceof Float32Array);
                    // Convert Float32Array[] to number[][] if needed
                    let fftSequenceNum = r.fftSequence;
                    let normFftSequenceNum = r.normalizedFftSequence;
                    if (Array.isArray(r.fftSequence) && r.fftSequence[0] instanceof Float32Array) {
                        fftSequenceNum = r.fftSequence.map((arr: Float32Array) => Array.from(arr));
                    }
                    if (Array.isArray(r.normalizedFftSequence) && r.normalizedFftSequence[0] instanceof Float32Array) {
                        normFftSequenceNum = r.normalizedFftSequence.map((arr: Float32Array) => Array.from(arr));
                    }
                    setFftResult({
                        normalizedFftSequence: normFftSequenceNum,
                        summary: r.summary,
                    });
                    // Use workerManager for visualization
                    workerManager.enqueueJob('visualization', {
                        fftSequence: fftSequenceNum,
                        bands: BAND_DEFS,
                        sampleRate,
                        hopSize: 512,
                    }).then((vizResult: any) => {
                        console.log('FFTSection: visualization worker result', vizResult);
                        setBandDataArr(vizResult.bandDataArr);
                        setPlotReady(true);
                        onFftComplete(); // Mark FFT as complete
                    }).catch((err: any) => {
                        setPlotReady(true); // Avoid spinner hang on error
                        console.error('FFTSection: visualization worker error', err);
                    });
                }
            })
            .catch((err) => {
                setPlotReady(true); // Avoid spinner hang on error
                console.error("FFTSection: worker error", err);
            });
    };

    console.log('FFTSection: bandDataArr', bandDataArr);

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

interface DetectionEngineSectionProps {
    bands: BandConfig[];
    pcm: Float32Array;
    sampleRate: number;
}

const DetectionEngineSection = ({ bands, pcm, sampleRate }: DetectionEngineSectionProps) => {
    const {
        results,
        setResults,
        bandResults,
        setBandResults,
        progress,
        setProgress,
        setIsLoading,
        error,
        setError,
    } = useDetectionData();
    const [selectedBand, setSelectedBand] = React.useState(0);
    const { currentTime } = usePlaybackState();
    const windowDuration = 15;
    const windowStart = Math.max(0, currentTime - windowDuration / 2);
    const [uiReady, setUiReady] = React.useState(false);
    // Detection logic
    const handleRunDetection = () => {
        setUiReady(false);
        setIsLoading(true);
        setError(undefined);
        setResults(null);
        setBandResults([]);
        setProgress({ processed: 0, total: 1 });
        // PCM detection (main, not per-band)
        workerManager.enqueueJob(
            'aubio',
            {
                engine: 'aubio',
                pcmBuffer: pcm.buffer,
                pcmLength: pcm.length,
                sampleRate,
                bands: bands.map(band => ({
                    name: band.name,
                    color: band.color,
                    pcmBuffer: band.pcm.buffer,
                    pcmLength: band.pcm.length,
                })),
            },
            (prog) => {
                console.log('DetectionEngineSection: prog', prog);
                setProgress(prog);
            }
        ).then((result) => {
            console.log('DetectionEngineSection: result', result);
            // Expect result to be { main: DetectionResult, bands: DetectionResult[] }
            type MultiBandDetectionResult = { main: DetectionResult; bands: DetectionResult[] };
            if (result && typeof result === 'object' && Array.isArray((result as MultiBandDetectionResult).bands)) {
                setResults((result as MultiBandDetectionResult).main);
                setBandResults((result as MultiBandDetectionResult).bands);
            } else {
                setResults(result as DetectionResult);
            }
            // Defer setting uiReady to next tick to ensure state is processed
            setTimeout(() => setUiReady(true), 0);
            setIsLoading(false);
        }).catch((err) => {
            console.log('DetectionEngineSection: error', err);
            setError(String(err));
            setIsLoading(false);
        });
    };
    return (
        <div style={{ marginTop: 32 }}>
            <h4>Detection Engine (Context Demo)</h4>
            <button
                onClick={handleRunDetection}
                disabled={bands.length === 0}
            >
                Run Detection
            </button>
            {/* Detection progress bar (PCM) */}
            {progress && progress.total > 0 && progress.processed < progress.total && (
                <ProgressBar
                    animate
                    stripes
                    value={progress.processed / progress.total}
                    style={{ margin: "16px 0", height: 10, width: 400 }}
                    intent="primary"
                />
            )}
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
                {/* Indeterminate progress bar if not UI ready */}
            {!uiReady && (
                <ProgressBar
                    animate
                    stripes
                    intent="primary"
                    value={undefined}
                    style={{ margin: "16px 0", height: 10, width: 400 }}
                />
            )}
            {error && <div style={{ color: "red" }}>{error}</div>}
        </div>
    );
};

// Replace the default export function with the provider wrapping the panel
export default function AudioAnalysisPanel() {
    return (
            <AudioAnalysisPanelInner />
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
        setBandConfigs,
        filtering,
        setFiltering,
        selectedEngine,
        setSelectedEngine,
        engineOptions,
        handleFileChange,
        progress,
    } = useAudioAnalysis();
    // Add a state to track if FFT is complete (must be inside component)
    const [fftComplete, setFftComplete] = React.useState(false);
    console.log('AudioAnalysisPanelInner: bandConfigs', bandConfigs, 'filtering', filtering);
    React.useEffect(() => {
        console.log('Panel: bandConfigs', bandConfigs, 'filtering', filtering);
    }, [bandConfigs, filtering]);
    React.useEffect(() => {
        if (bandConfigs.length > 0 && !filtering) {
            console.log('Band filtering complete, bandConfigs:', bandConfigs);
        }
    }, [bandConfigs, filtering]);

    // Band filtering logic (same pattern as FFT)
    const handleRunBandFiltering = () => {
        if (!pcm || !sampleRate) return;
        setFiltering(true);
        const bandDefs = [
            { name: "Sub Bass", freq: 60, q: 1, color: "#2b8cbe" },
            { name: "Bass", freq: 120, q: 1, color: "#41ab5d" },
            { name: "Low Mid", freq: 400, q: 1, color: "#fdae6b" },
            { name: "Mid", freq: 1000, q: 1, color: "#d94801" },
            { name: "High", freq: 4000, q: 1, color: "#756bb1" },
            { name: "Presence", freq: 8000, q: 1, color: "#f03b20" },
        ];
        const req = {
            pcmBuffer: pcm.buffer,
            sampleRate,
            bands: bandDefs
        };
        workerManager
            .enqueueJob(
                'bandFilter',
                req,
                // Optionally, add a progress callback here if you want to show progress
                (progress) => {
                    console.log('Band filtering progress:', progress);
                }
            )
            .then((result) => {
                const bandResult = result as { type: string; bands: { name: string; color: string; pcm: number[] }[] };
                if (bandResult && bandResult.type === 'done' && Array.isArray(bandResult.bands)) {
                    setBandConfigs(bandResult.bands.map((b) => ({
                        name: b.name,
                        pcm: Float32Array.from(b.pcm),
                        color: b.color
                    })));
                }
                setFiltering(false);
            });
    };

    return (
        <div style={{ maxWidth: 800, height: "100%", overflowY: "scroll", margin: "2rem auto", padding: 16 }}>
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
                <FFTSection pcm={pcm} sampleRate={sampleRate} onFftComplete={() => setFftComplete(true)} />
            )}
            {/* Band Filtering Step */}
            {pcm && sampleRate && (
                <div style={{ margin: '24px 0' }}>
                    <button
                        onClick={handleRunBandFiltering}
                        disabled={filtering || !fftComplete}
                        style={{
                            background: filtering || !fftComplete ? '#888' : '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '8px 20px',
                            fontWeight: 'bold',
                            fontSize: 16,
                            cursor: filtering || !fftComplete ? 'not-allowed' : 'pointer',
                            marginBottom: 12,
                        }}
                    >
                        {filtering ? 'Filtering Bands...' : 'Run Band Filtering'}
                    </button>
                    {filtering && (
                        <ProgressBar
                            animate
                            stripes
                            value={0.5}
                            intent="primary"
                            style={{ height: 10, borderRadius: 6, marginTop: 8 }}
                        />
                    )}
                </div>
            )}
            {/* Only show detection after band filtering is done */}
            {pcm && sampleRate && bandConfigs.length > 0 && !filtering && (
                <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 500, marginRight: 8 }}>
                            Engine:
                        </span>
                        {engineOptions.map((eng: string) => (
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
                        <DetectionEngineSection bands={bandConfigs} pcm={pcm} sampleRate={sampleRate} />
                </div>
            )}
        </div>
    );
} 

