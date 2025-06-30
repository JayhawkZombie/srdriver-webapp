import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Alert,
    TextField,
    FormControlLabel,
    Checkbox,
    Slider} from '@mui/material';
import {
    decodeAudioFile,
    getMonoPCMData,
} from "../controllers/audioChunker";
import WaveSurfer from "wavesurfer.js";
// Import worker (Vite/CRA style)
// @ts-expect-error "needed import for audioWorker"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import audioWorkerUrl from '../workers/audioWorker.ts?worker';
import GlobalControls from './GlobalControls';
import DerivativeImpulseToggles from './controls/DerivativeImpulseToggles';
import BandSelector from './visuals/BandSelector';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { PulseToolsProvider, usePulseTools } from '../controllers/PulseToolsContext';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import AudioChunkerDemoPlotArea from './visuals/AudioChunkerDemoPlotArea';
// @ts-expect-error "needed import for visualizationWorker"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import visualizationWorkerUrl from '../controllers/visualizationWorker.ts?worker';
import FFTProcessingControls from './controls/FFTProcessingControls';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Tooltip from '@mui/material/Tooltip';
import { useAppStore } from '../store/appStore';
import MenuItem from '@mui/material/MenuItem';
import { useImpulseEvents } from '../context/ImpulseEventContext';
import { clampDB } from './visuals/bandPlotUtils';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';

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

interface AudioChunkerDemoProps {
    onImpulse?: (strength: number, min: number, max: number, bandName?: string, time?: number) => void;
}

const DETECTION_ENGINES = [
    { label: 'Spectral Flux', value: 'spectral-flux' },
    { label: 'Aubio', value: 'aubio' },
    { label: '1st Derivative', value: 'first-derivative' },
    { label: '2nd Derivative', value: 'second-derivative' },
    { label: 'Z-Score (Derivative)', value: 'z-score' },
];

// --- Add a type for processing settings ---
type ProcessingSettings = {
    impulseWindowSize: number;
    impulseSmoothing: number;
    impulseDetectionMode: string;
    derivativeMode: string;
    spectralFluxWindow: number;
    spectralFluxK: number;
    spectralFluxMinSeparation: number;
    minDb: number;
    minDbDelta: number;
    windowSize: number;
    hopSize: number;
    selectedEngine: string;
};

const AudioChunkerDemo: React.FC<AudioChunkerDemoProps> = ({ onImpulse }) => {
    const file = useAppStore(state => state.file);
    const setFile = useAppStore(state => state.setFile);
    const windowSize = useAppStore(state => state.windowSize);
    const setWindowSize = useAppStore(state => state.setWindowSize);
    const hopSize = useAppStore(state => state.hopSize);
    const setHopSize = useAppStore(state => state.setHopSize);
    const loading = useAppStore(state => state.loading);
    const setLoading = useAppStore(state => state.setLoading);
    const audioUrl = useAppStore(state => state.audioUrl);
    const setAudioUrl = useAppStore(state => state.setAudioUrl);
    const isPlaying = useAppStore(state => state.isPlaying);
    const setIsPlaying = useAppStore(state => state.setIsPlaying);
    const playbackTime = useAppStore(state => state.playbackTime);
    const setPlaybackTime = useAppStore(state => state.setPlaybackTime);
    const hasProcessedOnce = useAppStore(state => state.hasProcessedOnce);
    const setHasProcessedOnce = useAppStore(state => state.setHasProcessedOnce);
    const isProcessingStale = useAppStore(state => state.isProcessingStale);
    const setIsProcessingStale = useAppStore(state => state.setIsProcessingStale);
    const followCursor = useAppStore(state => state.followCursor);
    const setFollowCursor = useAppStore(state => state.setFollowCursor);
    const snapToWindow = useAppStore(state => state.snapToWindow);
    const setSnapToWindow = useAppStore(state => state.setSnapToWindow);
    const selectedEngine = useAppStore(state => state.selectedEngine);
    const setSelectedEngine = useAppStore(state => state.setSelectedEngine);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const waveformRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [clearMsg, setClearMsg] = useState<string | null>(null);
    const windowSec = useAppStore(state => state.windowSec);
    const setWindowSec = useAppStore(state => state.setWindowSec);
    const selectedBand = useAppStore(state => state.selectedBand);
    const setSelectedBand = useAppStore(state => state.setSelectedBand);
    const { devices } = useDeviceControllerContext();
    const connectedDevices = devices.filter(d => d.isConnected);
    const activeDeviceId = useAppStore(state => state.activeDeviceId);
    const setActiveDeviceId = useAppStore(state => state.setActiveDeviceId);
    const { audioData, setAudioData } = useAppStore();
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const { values } = usePulseTools();
    const impulseWindowSize = useAppStore(state => state.impulseWindowSize);
    const impulseSmoothing = useAppStore(state => state.impulseSmoothing);
    const impulseDetectionMode = useAppStore(state => state.impulseDetectionMode);
    const derivativeMode = useAppStore((state) => state.derivativeMode || 'centered');
    const spectralFluxWindow = useAppStore((state) => state.spectralFluxWindow);
    const spectralFluxK = useAppStore((state) => state.spectralFluxK);
    const spectralFluxMinSeparation = useAppStore((state) => state.spectralFluxMinSeparation);
    const showSustainedImpulses = useAppStore(state => state.showSustainedImpulses);
    const setShowSustainedImpulses = useAppStore(state => state.setShowSustainedImpulses);
    const onlySustained = useAppStore(state => state.onlySustained);
    const setOnlySustained = useAppStore(state => state.setOnlySustained);
    const [processingProgress, setProcessingProgress] = useState<{ processed: number; total: number } | null>(null);
    const minDb = useAppStore(state => state.minDb);
    const minDbDelta = useAppStore(state => state.minDbDelta);
    const lastProcessedSettings = useRef<ProcessingSettings | null>(null);
    const { emit } = useImpulseEvents();
    const lastPlaybackTimeRef = useRef<number>(-Infinity);
    const emittedImpulseKeysRef = useRef<Set<string>>(new Set());
    const analysis = audioData.analysis;
    const bandDataArr = (analysis?.bandDataArr ?? []) as any[];
    const normalizedImpulseThreshold = useAppStore(state => state.normalizedImpulseThreshold);
    const bleLookaheadMs = useAppStore(state => state.bleLookaheadMs);
    const minMagnitudeThreshold = useAppStore(state => state.minMagnitudeThreshold);

    // Debounced impulse handler using new paradigm
    const debouncedPulse = useDebouncedCallback(
        (_strength: number, _min: number, _max: number, _bandName?: string, _time?: number) => {
            // Placeholder for the removed emitPulse function
        },
        values.current.debounceMs
    );

    // Visualization worker ref
    const audioWorkerRef = useRef<Worker | null>(null);
    const visualizationWorkerRef = useRef<Worker | null>(null);

    // Determine if audio is loaded
    const audioLoaded = !!(audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0);

    // const derivativeLogDomain = true; // Always use log domain for now (commented out, unused)

    // Refactored effect for isProcessingStale
    useEffect(() => {
        if (!audioLoaded || !hasProcessedOnce) return;
        // Gather current settings
        const currentSettings: ProcessingSettings = {
            impulseWindowSize,
            impulseSmoothing,
            impulseDetectionMode,
            derivativeMode,
            spectralFluxWindow,
            spectralFluxK,
            spectralFluxMinSeparation,
            minDb,
            minDbDelta,
            windowSize,
            hopSize,
            selectedEngine,
        };
        // Compare to last processed settings
        const isStale = !lastProcessedSettings.current ||
            (Object.keys(currentSettings) as (keyof ProcessingSettings)[]).some(
                key => currentSettings[key] !== lastProcessedSettings.current?.[key]
            );
        if (isStale && !isProcessingStale) {
            setIsProcessingStale(true);
        }
        if (!isStale && isProcessingStale) {
            setIsProcessingStale(false);
        }
    }, [
        impulseWindowSize, impulseSmoothing, impulseDetectionMode, derivativeMode,
        spectralFluxWindow, spectralFluxK, spectralFluxMinSeparation,
        minDb, minDbDelta, windowSize, hopSize, selectedEngine,
        audioLoaded, hasProcessedOnce, isProcessingStale, setIsProcessingStale
    ]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
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
        audioWorkerRef.current = new Worker(new URL('../workers/audioWorker.ts', import.meta.url), { type: 'module' });
        // @ts-ignore
        visualizationWorkerRef.current = new Worker(new URL('../controllers/visualizationWorker.ts', import.meta.url), { type: 'module' });
        // Latch progress to highest value ever received, and filter by jobId
        const highestProgressRef = { current: 0 };
        const currentJobIdRef = { current: '' };
        audioWorkerRef.current!.onmessage = (e: MessageEvent) => {
            const { type, processed, total, summary, fftSequence, detectionFunction, times, jobId } = e.data;
            if (type === 'progress') {
                console.log('setProcessingProgress called with:', { processed, total, jobId, currentJobId: currentJobIdRef.current });
                if (jobId === currentJobIdRef.current && processed >= highestProgressRef.current) {
                    highestProgressRef.current = processed;
                    if (!processingProgress || processed > processingProgress.processed) {
                        setProcessingProgress({ processed, total });
                    }
                }
            } else if (type === 'done') {
                if (jobId === currentJobIdRef.current) {
                    highestProgressRef.current = 0; // Reset for next run
                    currentJobIdRef.current = '';
                    const audioBuffer = audioBufferRef.current;
                    let newSummary = summary;
                    if (audioBuffer && summary) {
                        newSummary = { ...summary, totalDurationMs: audioBuffer.duration * 1000 };
                    }
                    // After audio worker is done, call visualization worker
                    if (visualizationWorkerRef.current && fftSequence && fftSequence.length > 0) {
                        visualizationWorkerRef.current.onmessage = (ve: MessageEvent) => {
                            const { bandDataArr } = ve.data;
                            setAudioData({
                                analysis: {
                                    fftSequence: fftSequence ?? [],
                                    summary: newSummary ?? null,
                                    audioBuffer: audioBuffer ?? null,
                                    bandDataArr,
                                    impulseStrengths: Array.isArray(bandDataArr) ? bandDataArr.map((b: { impulseStrengths: number[] }) => b.impulseStrengths) : [],
                                    detectionFunction: detectionFunction || [],
                                    detectionTimes: times || [],
                                }
                            });
                            setLoading(false);
                            setProcessingProgress(null);
                        };
                        visualizationWorkerRef.current.postMessage({
                            fftSequence: (fftSequence ?? []).map((arr: number[] | Float32Array) => Array.isArray(arr) ? arr : Array.from(arr)),
                            bands: BAND_DEFINITIONS,
                            sampleRate: audioBuffer?.sampleRate || 44100,
                            hopSize: newSummary?.hopSize || 512,
                            impulseWindowSize,
                            impulseSmoothing,
                            impulseDetectionMode,
                            minDb,
                            minDbDelta,
                            minMagnitudeThreshold,
                        });
                    } else {
                        // Fallback: just save fftSequence etc.
                        setAudioData({ analysis: {
                            fftSequence: fftSequence ?? [],
                            summary: newSummary ?? null,
                            audioBuffer: audioBuffer ?? null,
                            detectionFunction: detectionFunction || [],
                            detectionTimes: times || [],
                        }});
                        setLoading(false);
                        setProcessingProgress(null);
                    }
                }
            }
        };
        // Expose jobId ref for handleProcess
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (audioWorkerRef.current as any).currentJobIdRef = currentJobIdRef;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (audioWorkerRef.current as any).highestProgressRef = highestProgressRef;
        return () => {
            audioWorkerRef.current?.terminate();
            visualizationWorkerRef.current?.terminate();
        };
    }, []);

    const handleProcess = async () => {
        if (!file) return;
        setLoading(true);
        setIsProcessingStale(false);
        setHasProcessedOnce(true);
        setAudioData({ analysis: null }); // Reset analysis
        setProcessingProgress(null); // Reset progress
        try {
            // Generate a unique jobId for this processing run
            const jobId = Date.now().toString() + Math.random().toString(36).slice(2);
            // Save jobId to ref for filtering
            if (audioWorkerRef.current && (audioWorkerRef.current as any).currentJobIdRef && (audioWorkerRef.current as any).highestProgressRef) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (audioWorkerRef.current as any).currentJobIdRef.current = jobId;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (audioWorkerRef.current as any).highestProgressRef.current = 0;
            }
            // Decode in main thread, send PCM to worker
            const audioBuffer = await decodeAudioFile(file);
            audioBufferRef.current = audioBuffer; // Save to ref
            setAudioData({ analysis: {
                fftSequence: [],
                summary: null,
                audioBuffer
            }});
            const pcmData = getMonoPCMData(audioBuffer);
            // Send to detection worker with selected engine and jobId
            audioWorkerRef.current!.postMessage({
                pcmBuffer: pcmData.buffer,
                windowSize,
                hopSize,
                engine: selectedEngine,
                jobId,
            });
            // Save current settings as last processed
            lastProcessedSettings.current = {
                impulseWindowSize,
                impulseSmoothing,
                impulseDetectionMode,
                derivativeMode,
                spectralFluxWindow,
                spectralFluxK,
                spectralFluxMinSeparation,
                minDb,
                minDbDelta,
                windowSize,
                hopSize,
                selectedEngine,
            };
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
        setAudioData({ analysis: null, metadata: null });
        setFile(null);
        setAudioUrl(undefined);
        setClearMsg('Cleared audio data from app state');
        setTimeout(() => setClearMsg(null), 2000);
    };

    useEffect(() => {
        if (!analysis || !analysis.summary || !analysis.audioBuffer) {
            return;
        }
        const bandData = bandDataArr.find(b => b.band?.name === selectedBand);
        if (!bandData) {
            return;
        }
        const showImpulses = useAppStore.getState().showImpulses;
        const onlySustained = useAppStore.getState().onlySustained;
        if (!showImpulses) {
            return;
        }
        let impulseTimes: number[] = [];
        let impulseStrengths: number[] = [];
        const times = Array.from({ length: bandData.magnitudes.length }, (_, i) => (i * (analysis.summary.hopSize as number)) / (analysis.audioBuffer!.sampleRate));
        if (onlySustained && bandData.sustainedImpulses) {
            const magnitudes = bandData.magnitudes;
            const sustained = bandData.sustainedImpulses;
            const indices = sustained.map((v: number, i: number) => v > 0 ? i : -1).filter((i: number) => i >= 0);
            impulseTimes = indices.map((i: number) => times[i]);
            impulseStrengths = indices.map((i: number) => clampDB(magnitudes[i]));
        } else if (bandData.normalizedImpulseStrengths && bandData.magnitudes) {
            const impulseStrengthsArr = bandData.normalizedImpulseStrengths;
            const indices = impulseStrengthsArr.map((v: number, i: number) => v > normalizedImpulseThreshold ? i : -1).filter((i: number) => i >= 0);
            impulseTimes = indices.map((i: number) => times[i]);
            impulseStrengths = indices.map((i: number) => clampDB(bandData.magnitudes[i]));
        }
        const minStrength = Math.min(...impulseStrengths);
        const maxStrength = Math.max(...impulseStrengths);
        const prev = lastPlaybackTimeRef.current;
        const curr = playbackTime + (bleLookaheadMs / 1000);
        impulseTimes.forEach((time, idx) => {
            const key = `${bandData.band.name}|${time}`;
            const crossed = ((time > prev && time <= curr) || (time > curr && time <= prev));
            if (
                !emittedImpulseKeysRef.current.has(key) &&
                crossed
            ) {
                emit({ strength: impulseStrengths[idx], min: minStrength, max: maxStrength, bandName: bandData.band.name, time });
                emittedImpulseKeysRef.current.add(key);
            }
        });
        if (curr < prev) {
            emittedImpulseKeysRef.current.clear();
        }
        lastPlaybackTimeRef.current = curr;
    }, [playbackTime, analysis, selectedBand, bleLookaheadMs]);

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
                                {/* Detection engine selector */}
                                <TextField
                                    select
                                    label="Detection Engine"
                                    value={selectedEngine}
                                    onChange={e => setSelectedEngine(e.target.value)}
                                    size="small"
                                    sx={{ minWidth: 160 }}
                                >
                                    {DETECTION_ENGINES.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {isProcessingStale && hasProcessedOnce && (
                                    <Tooltip title="Processing settings changed. Click 'Process Audio' to update.">
                                        <WarningAmberIcon color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                                    </Tooltip>
                                )}
                                <FFTProcessingControls
                                    windowSize={windowSize}
                                    setWindowSize={setWindowSize}
                                    hopSize={hopSize}
                                    setHopSize={setHopSize}
                                    fileLoaded={!!file}
                                />
                                <Box sx={{ minWidth: 180, ml: 2 }}>
                                    <GlobalControls
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
                            {audioData.analysis && audioData.analysis.summary && (
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Chunks:</strong> {audioData.analysis.summary.numChunks}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Chunk:</strong> {typeof audioData.analysis.summary.chunkDurationMs === 'number' ? audioData.analysis.summary.chunkDurationMs.toFixed(2) : ''} ms
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Total:</strong> {typeof audioData.analysis.summary.totalDurationMs === 'number' ? audioData.analysis.summary.totalDurationMs.toFixed(2) : ''} ms
                                    </Typography>
                                </Stack>
                            )}
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                                    <CropLandscapeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ mr: 1 }}>Window Size</Typography>
                                    <Slider
                                        min={2}
                                        max={30}
                                        step={1}
                                        value={windowSec}
                                        onChange={(_, v) => setWindowSec(Number(v))}
                                        valueLabelDisplay="auto"
                                        size="small"
                                        sx={{ width: 80 }}
                                    />
                                    <Typography variant="caption" sx={{ ml: 1 }}>{windowSec}s</Typography>
                                </Box>
                                <DerivativeImpulseToggles />
                                {audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0 && <BandSelector />}
                                <FormControlLabel control={<Checkbox checked={showSustainedImpulses} onChange={e => setShowSustainedImpulses(e.target.checked)} />} label="Sustained" />
                                <FormControlLabel control={<Checkbox checked={onlySustained} onChange={e => setOnlySustained(e.target.checked)} />} label="Only Sustained" />
                            </Stack>
                            {/* Main plot area: show plot, skeletons, or loading spinner in the same space */}
                            <AudioChunkerDemoPlotArea
                              file={file}
                              loading={loading}
                              processingProgress={processingProgress}
                              audioData={audioData}
                              debouncedPulse={debouncedPulse}
                              onImpulse={onImpulse || debouncedPulse}
                            />
                        </Box>
                        {/* Right: Visualizer → Lights Connection Placeholder */}
                        {/* {/* <Box sx={{ flex: 1, minWidth: 220, maxWidth: 420, width: '100%', ml: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* <PulseToolsCard /> */}
                            {/* <PulseControlsPanel /> */}
                            {/* <ImpulseResponseCard /> */}
                        {/* </Box> */}  
                    </Box>
                    {/* Button to manually clear app state from IndexedDB */}
                    <Button variant="outlined" color="error" size="small" onClick={handleClearAppState} sx={{ mb: 1 }}>
                        Clear Audio Data
                    </Button>
                    {clearMsg && <Alert severity="info" sx={{ mb: 1 }}>{clearMsg}</Alert>}
                </Paper>
            </PulseToolsProvider>
        </ActiveDeviceContext.Provider>
    );
};

export default AudioChunkerDemo;
