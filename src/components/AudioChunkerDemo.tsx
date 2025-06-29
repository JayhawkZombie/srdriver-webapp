import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Stack,
    Divider,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Skeleton,
    LinearProgress,
    Snackbar,
    Alert,
    Slider,
    AppBar,
    Toolbar,
    Tabs,
    Tab
} from '@mui/material';
import {
    decodeAudioFile,
    getMonoPCMData,
    chunkPCMData,
} from "../controllers/audioChunker";
import { computeFFTMagnitude } from "../controllers/fftUtils";
import Plot from 'react-plotly.js';
import AudioFrequencyVisualizer from './AudioFrequencyVisualizer';
import WaveSurfer from "wavesurfer.js";
// Import worker (Vite/CRA style)
// @ts-ignore
import audioWorkerUrl from '../controllers/audioWorker.ts?worker';
import GlobalControls from './GlobalControls';
import DerivativeImpulseToggles from './DerivativeImpulseToggles';
import BandSelector from './BandSelector';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { usePulseContext } from '../controllers/PulseContext';
import { useToastContext } from '../controllers/ToastContext';
import LightsConnectionCard from './LightsConnectionCard';
import { useAppStore } from '../store/appStore';
import PulseToolsCard from './PulseToolsCard';
import { PulseToolsProvider, usePulseTools } from '../controllers/PulseToolsContext';
import { Device } from '../types/Device';
import { emitPulse } from './useImpulseHandler';
import { useDebouncedCallback } from './useDebouncedCallback';
import ImpulseResponseCard from './ImpulseResponseCard';
import AudioChunkerDemoPlotArea from './AudioChunkerDemoPlotArea';
import { ImpulseResponseProvider } from '../context/ImpulseResponseContext';
// Import the visualization worker
// @ts-ignore
import visualizationWorkerUrl from '../controllers/visualizationWorker.ts?worker';
import { del } from 'idb-keyval';
import FFTProcessingControls from './FFTProcessingControls';
import { alpha } from '@mui/material/styles';

interface ChunkSummary {
    numChunks: number;
    chunkDurationMs: number;
    totalDurationMs: number;
    windowSize: number;
    hopSize: number;
    firstChunkFFT?: number[];
    firstChunkFFTMagnitudes?: Float32Array;
}

const DEFAULT_WINDOW_SIZE = 1024;
const DEFAULT_HOP_SIZE = 512;

// Context for active device selection
interface ActiveDeviceContextType {
    activeDeviceId: string | null;
    setActiveDeviceId: (id: string | null) => void;
}
export const ActiveDeviceContext = createContext<ActiveDeviceContextType | undefined>(undefined);
export function useActiveDevice() {
    const ctx = useContext(ActiveDeviceContext);
    if (!ctx) throw new Error('useActiveDevice must be used within ActiveDeviceContext.Provider');
    return ctx;
}

const BAND_DEFINITIONS = [
    { name: 'Bass', freq: 60, color: 'blue' },
    { name: 'Low Mid', freq: 250, color: 'green' },
    { name: 'Mid', freq: 1000, color: 'orange' },
    { name: 'Treble', freq: 4000, color: 'red' },
    { name: 'High Treble', freq: 8000, color: 'purple' },
];

const AudioChunkerDemo: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [windowSize, setWindowSize] = useState<number>(DEFAULT_WINDOW_SIZE);
    const [hopSize, setHopSize] = useState<number>(DEFAULT_HOP_SIZE);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
    const waveformRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const audioWorkerRef = useRef<Worker | null>(null);
    const [processingProgress, setProcessingProgress] = useState<{ processed: number, total: number } | null>(null);
    const windowSec = useAppStore(state => state.windowSec);
    const setWindowSec = useAppStore(state => state.setWindowSec);
    const showFirstDerivative = useAppStore(state => state.showFirstDerivative);
    const setShowFirstDerivative = useAppStore(state => state.setShowFirstDerivative);
    const showSecondDerivative = useAppStore(state => state.showSecondDerivative);
    const setShowSecondDerivative = useAppStore(state => state.setShowSecondDerivative);
    const showImpulses = useAppStore(state => state.showImpulses);
    const setShowImpulses = useAppStore(state => state.setShowImpulses);
    const selectedBand = useAppStore(state => state.selectedBand);
    const setSelectedBand = useAppStore(state => state.setSelectedBand);
    const [followCursor, setFollowCursor] = useState(false);
    const [snapToWindow, setSnapToWindow] = useState(true);
    const { devices } = useDeviceControllerContext();
    const connectedDevices = devices.filter(d => d.isConnected);
    const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
    const { latestPulse, latestPulseTimestamp } = usePulseContext();
    const { showToast } = useToastContext();
    const { audioData, setAudioData } = useAppStore();
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const { values } = usePulseTools();
    const activeDevice = devices.find(d => d.id === activeDeviceId);
    const normalizedImpulseThreshold = useAppStore(state => state.normalizedImpulseThreshold);
    const setNormalizedImpulseThreshold = useAppStore(state => state.setNormalizedImpulseThreshold);
    const impulseWindowSize = useAppStore(state => state.impulseWindowSize);
    const impulseSmoothing = useAppStore(state => state.impulseSmoothing);
    const impulseDetectionMode = useAppStore(state => state.impulseDetectionMode);
    const derivativeMode = useAppStore((state) => state.derivativeMode || 'centered');
    const spectralFluxWindow = useAppStore((state) => state.spectralFluxWindow);
    const spectralFluxK = useAppStore((state) => state.spectralFluxK);
    const spectralFluxMinSeparation = useAppStore((state) => state.spectralFluxMinSeparation);

    // Debounce state for pulses
    const pulseInProgressRef = React.useRef(false);
    const lastPulseTimeRef = React.useRef(0);

    // Debounced impulse handler using new paradigm
    const debouncedPulse = useDebouncedCallback(
        (strength: number, min: number, max: number, bandName?: string, time?: number) => {
            emitPulse({
                strength,
                min,
                max,
                bandName,
                time,
                tools: values.current,
                device: activeDevice,
                showToast,
            });
        },
        values.current.debounceMs
    );

    // Visualization worker ref
    const visualizationWorkerRef = useRef<Worker | null>(null);

    // State for showing clear confirmation
    const [clearMsg, setClearMsg] = useState<string | null>(null);

    // Determine if audio is loaded
    const audioLoaded = !!(audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0);

    const derivativeLogDomain = true; // Always use log domain for now

    // Debounced re-processing effect for FFT/impulse controls
    React.useEffect(() => {
        if (!audioLoaded || !file) return;
        // Debounce re-processing
        const debounced = setTimeout(() => {
            setLoading(true);
            setProcessingProgress(null);
            // Only re-run visualization worker (not full audio worker)
            if (visualizationWorkerRef.current && audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0) {
                visualizationWorkerRef.current.onmessage = (ve: MessageEvent) => {
                    const { bandDataArr } = ve.data;
                    const currentAnalysis = audioData.analysis;
                    setAudioData({
                        analysis: {
                            ...currentAnalysis,
                            bandDataArr,
                            impulseStrengths: bandDataArr.map((b: any) => b.impulseStrengths),
                            fftSequence: currentAnalysis?.fftSequence ?? [],
                            summary: currentAnalysis?.summary ?? {},
                            audioBuffer: currentAnalysis?.audioBuffer ?? null,
                        }
                    });
                    setLoading(false);
                    setProcessingProgress(null);
                };
                visualizationWorkerRef.current.postMessage({
                    fftSequence: audioData.analysis.fftSequence.map((arr: any) => Array.from(arr)),
                    bands: BAND_DEFINITIONS,
                    sampleRate: audioData.analysis.audioBuffer?.sampleRate || 44100,
                    hopSize: audioData.analysis.summary?.hopSize || 512,
                    impulseWindowSize,
                    impulseSmoothing,
                    impulseDetectionMode,
                    derivativeLogDomain,
                    derivativeMode,
                    spectralFluxWindow,
                    spectralFluxK,
                    spectralFluxMinSeparation,
                });
            }
        }, 500);
        return () => clearTimeout(debounced);
    }, [impulseWindowSize, impulseSmoothing, impulseDetectionMode, audioLoaded, file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Clear persisted app state in IndexedDB when a new file is uploaded
            del('app-state').then(() => {
                setClearMsg('Cleared app-state from IndexedDB');
                setTimeout(() => setClearMsg(null), 2000);
            });
            setFile(e.target.files[0]);
            setAudioData({ analysis: null, metadata: null });
            setAudioUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Set up the worker and cleanup
    useEffect(() => {
        // @ts-ignore
        audioWorkerRef.current = new Worker(new URL('../controllers/audioWorker.ts', import.meta.url));
        // @ts-ignore
        visualizationWorkerRef.current = new Worker(new URL('../controllers/visualizationWorker.ts', import.meta.url));
        audioWorkerRef.current.onmessage = (e) => {
            const { type, processed, total, summary, fftSequence } = e.data;
            if (type === 'progress') {
                setProcessingProgress({ processed, total });
            } else if (type === 'done') {
                const audioBuffer = audioBufferRef.current;
                if (audioBuffer && summary) {
                    summary.totalDurationMs = audioBuffer.duration * 1000;
                }
                // After audio worker is done, call visualization worker
                if (visualizationWorkerRef.current && fftSequence && fftSequence.length > 0) {
                    visualizationWorkerRef.current.onmessage = (ve: MessageEvent) => {
                        const { bandDataArr } = ve.data;
                        setAudioData({
                            analysis: {
                                fftSequence: fftSequence ?? [],
                                summary: summary ?? null,
                                audioBuffer: audioBuffer ?? null,
                                bandDataArr,
                                impulseStrengths: bandDataArr.map((b: any) => b.impulseStrengths),
                            }
                        });
                        setLoading(false);
                        setProcessingProgress(null);
                    };
                    visualizationWorkerRef.current.postMessage({
                        fftSequence: fftSequence.map((arr: any) => Array.from(arr)),
                        bands: BAND_DEFINITIONS,
                        sampleRate: audioBuffer?.sampleRate || 44100,
                        hopSize: summary?.hopSize || 512,
                        impulseWindowSize,
                        impulseSmoothing,
                        impulseDetectionMode,
                    });
                } else {
                    // Fallback: just save fftSequence etc.
                    setAudioData({ analysis: {
                        fftSequence: fftSequence ?? [],
                        summary: summary ?? null,
                        audioBuffer: audioBuffer ?? null
                    }});
                    setLoading(false);
                    setProcessingProgress(null);
                }
            }
        };
        return () => {
            audioWorkerRef.current?.terminate();
            visualizationWorkerRef.current?.terminate();
        };
    }, []);

    const handleProcess = async () => {
        if (!file) return;
        setLoading(true);
        setAudioData({ analysis: null }); // Reset analysis
        setProcessingProgress(null); // Reset progress
        try {
            // Decode in main thread, send PCM to worker
            const audioBuffer = await decodeAudioFile(file);
            audioBufferRef.current = audioBuffer; // Save to ref
            setAudioData({ analysis: {
                fftSequence: [],
                summary: null,
                audioBuffer
            }});
            const pcmData = getMonoPCMData(audioBuffer);
            audioWorkerRef.current?.postMessage({
                pcmBuffer: pcmData.buffer,
                windowSize,
                hopSize,
            });
        } catch (err) {
            alert("Error decoding audio file.");
            setLoading(false);
            setProcessingProgress(null);
        }
    };

    useEffect(() => {
        if (!audioUrl || !waveformRef.current) return;
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }
        wavesurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: "#90caf9",
            progressColor: "#1976d2",
            height: 100,
            barWidth: 2,
            cursorColor: "#f50057",
        });
        wavesurferRef.current.load(audioUrl);
        wavesurferRef.current.on('finish', () => setIsPlaying(false));
        // Listen to playback position
        wavesurferRef.current.on('audioprocess', (time: number) => {
            setPlaybackTime(time);
        });
        wavesurferRef.current.on('interaction', () => {
            setPlaybackTime(wavesurferRef.current?.getCurrentTime() || 0);
        });
        return () => {
            wavesurferRef.current?.destroy();
        };
    }, [audioUrl]);

    const handlePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
            setIsPlaying(wavesurferRef.current.isPlaying());
        }
    };

    useEffect(() => {
        if (
            audioData.analysis?.fftSequence &&
            audioData.analysis.fftSequence.length > 0 &&
            audioData.analysis.audioBuffer &&
            !selectedBand
        ) {
            setSelectedBand('Bass');
        }
    }, [audioData.analysis, selectedBand, setSelectedBand]);

    useEffect(() => {
        if (connectedDevices.length > 0 && !activeDeviceId) {
            setActiveDeviceId(connectedDevices[0].id);
        } else if (connectedDevices.length === 0 && activeDeviceId) {
            setActiveDeviceId(null);
        }
    }, [connectedDevices, activeDeviceId]);

    // Handler for manual clear
    const handleClearAppState = () => {
        del('app-state').then(() => {
            setClearMsg('Cleared app-state from IndexedDB');
            setTimeout(() => setClearMsg(null), 2000);
        });
    };

    return (
        <ActiveDeviceContext.Provider value={{ activeDeviceId, setActiveDeviceId }}>
            <PulseToolsProvider>
                {/* Main content area below sticky bars */}
                <Paper
                    elevation={2}
                    sx={{
                        width: '100%',
                        margin: '2rem 0',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        minWidth: 320,
                        mt: 4,
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Audio Chunker Demo
                    </Typography>
                    <ImpulseResponseProvider>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                            {/* Left: controls and plot */}
                            <Box sx={{ flex: 2, minWidth: 0, width: '100%' }}>
                                {/* Modern, compact horizontal toolbar for all top controls */}
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2, mt: 1 }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleFileButtonClick}
                                        sx={{ minWidth: 110 }}
                                    >
                                        Choose File
                                    </Button>
                                    <Typography variant="body2" sx={{ minWidth: 120, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file ? file.name : 'No file chosen'}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleProcess}
                                        disabled={!file || loading}
                                        sx={{ minWidth: 120 }}
                                    >
                                        {loading ? 'Processing...' : 'Process Audio'}
                                    </Button>
                                    <FFTProcessingControls
                                        windowSize={windowSize}
                                        setWindowSize={setWindowSize}
                                        hopSize={hopSize}
                                        setHopSize={setHopSize}
                                        fileLoaded={!!file}
                                    />
                                    <Box sx={{ minWidth: 180, ml: 2 }}>
                                        <GlobalControls
                                            windowSec={windowSec}
                                            maxTime={audioData.analysis?.summary ? audioData.analysis.summary.totalDurationMs / 1000 : 60}
                                            onWindowSecChange={setWindowSec}
                                            followCursor={followCursor}
                                            onFollowCursorChange={setFollowCursor}
                                            snapToWindow={snapToWindow}
                                            onSnapToWindowChange={setSnapToWindow}
                                        />
                                    </Box>
                                </Box>
                                {audioUrl && (
                                    <Box sx={{ mt: 1 }}>
                                        <div ref={waveformRef} />
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={handlePlayPause}
                                            disabled={!audioUrl}
                                        >
                                            {isPlaying ? 'Pause' : 'Play'}
                                        </Button>
                                    </Box>
                                )}
                                {audioData.analysis?.summary && (
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Chunks:</strong> {audioData.analysis.summary.numChunks}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Chunk:</strong> {audioData.analysis.summary.chunkDurationMs?.toFixed(2)} ms
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Total:</strong> {audioData.analysis.summary.totalDurationMs?.toFixed(2)} ms
                                        </Typography>
                                    </Stack>
                                )}
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                                    <DerivativeImpulseToggles
                                        showFirstDerivative={showFirstDerivative}
                                        onShowFirstDerivative={setShowFirstDerivative}
                                        showSecondDerivative={showSecondDerivative}
                                        onShowSecondDerivative={setShowSecondDerivative}
                                        showImpulses={showImpulses}
                                        onShowImpulses={setShowImpulses}
                                    />
                                    {audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0 && (
                                        <BandSelector
                                            bands={audioData.analysis.fftSequence[0] && audioData.analysis.audioBuffer ? [
                                                { name: 'Bass' }, { name: 'Low Mid' }, { name: 'Mid' }, { name: 'Treble' }, { name: 'High Treble' }
                                            ] : []}
                                            selectedBand={selectedBand}
                                            onSelect={setSelectedBand}
                                        />
                                    )}
                                </Stack>
                                {/* Main plot area: show plot, skeletons, or loading spinner in the same space */}
                                <AudioChunkerDemoPlotArea
                                  file={file}
                                  loading={loading}
                                  processingProgress={processingProgress}
                                  audioData={audioData}
                                  plotProps={{
                                    fftSequence: audioData.analysis?.fftSequence,
                                    sampleRate: audioData.analysis?.audioBuffer?.sampleRate,
                                    windowSize,
                                    hopSize,
                                    audioBuffer: audioData.analysis?.audioBuffer,
                                    playbackTime,
                                    windowSec,
                                    followCursor,
                                    snapToWindow,
                                    showFirstDerivative,
                                    showSecondDerivative,
                                    showImpulses,
                                    selectedBand,
                                  }}
                                  debouncedPulse={debouncedPulse}
                                />
                            </Box>
                            {/* Right: Visualizer → Lights Connection Placeholder */}
                            <Box sx={{ flex: 1, minWidth: 220, maxWidth: 420, width: '100%', ml: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <LightsConnectionCard
                                    connectedDevices={connectedDevices}
                                    activeDeviceId={activeDeviceId}
                                    setActiveDeviceId={setActiveDeviceId}
                                />
                                <PulseToolsCard />
                                <ImpulseResponseCard />
                            </Box>
                        </Box>
                    </ImpulseResponseProvider>
                    {/* Button to manually clear app state from IndexedDB */}
                    <Button variant="outlined" color="error" size="small" onClick={handleClearAppState} sx={{ mb: 1 }}>
                        Clear App State (IndexedDB)
                    </Button>
                    {clearMsg && <Alert severity="info" sx={{ mb: 1 }}>{clearMsg}</Alert>}
                </Paper>
            </PulseToolsProvider>
        </ActiveDeviceContext.Provider>
    );
};

export default AudioChunkerDemo;
