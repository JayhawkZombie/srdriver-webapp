import React, { useState, useRef, useEffect, useCallback } from "react";
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
    Alert
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
    const [windowSec, setWindowSec] = useState(4);
    const [followCursor, setFollowCursor] = useState(false);
    const [snapToWindow, setSnapToWindow] = useState(true);
    const [showFirstDerivative, setShowFirstDerivative] = useState(false);
    const [showSecondDerivative, setShowSecondDerivative] = useState(false);
    const [showImpulses, setShowImpulses] = useState(true);
    const [selectedBand, setSelectedBand] = useState('');
    const { devices } = useDeviceControllerContext();
    const connectedDevices = devices.filter(d => d.isConnected);
    const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
    const { latestPulse, latestPulseTimestamp } = usePulseContext();
    const { showToast } = useToastContext();
    const { audioData, setAudioData } = useAppStore();
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    // Debounce state for pulses
    const pulseInProgressRef = React.useRef(false);
    const lastPulseTimeRef = React.useRef(0);

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
        audioWorkerRef.current = new Worker(new URL('../controllers/audioWorker.ts', import.meta.url));
        audioWorkerRef.current.onmessage = (e) => {
            const { type, processed, total, summary, fftSequence } = e.data;
            if (type === 'progress') {
                setProcessingProgress({ processed, total });
            } else if (type === 'done') {
                const audioBuffer = audioBufferRef.current;
                if (audioBuffer && summary) {
                    summary.totalDurationMs = audioBuffer.duration * 1000;
                }
                setAudioData({ analysis: {
                    fftSequence: fftSequence ?? [],
                    summary: summary ?? null,
                    audioBuffer: audioBuffer ?? null
                }});
                setLoading(false);
                setProcessingProgress(null);
            }
        };
        return () => {
            audioWorkerRef.current?.terminate();
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
    }, [audioData.analysis, selectedBand]);

    useEffect(() => {
        if (connectedDevices.length > 0 && !activeDeviceId) {
            setActiveDeviceId(connectedDevices[0].id);
        } else if (connectedDevices.length === 0 && activeDeviceId) {
            setActiveDeviceId(null);
        }
    }, [connectedDevices, activeDeviceId]);

    useEffect(() => {
        if (latestPulse && latestPulseTimestamp) {
            showToast(`Pulse: ${latestPulse.bandName} @ ${latestPulse.time.toFixed(2)}s (strength: ${latestPulse.strength.toFixed(1)})`);
        }
    }, [latestPulseTimestamp]);

    // Helper to normalize impulse strength to brightness (31-90)
    const normalizeStrengthToBrightness = (strength: number, min: number, max: number) => {
        const BRIGHTNESS_MIN = 31;
        const BRIGHTNESS_MAX = 90;
        if (max === min) return Math.round((BRIGHTNESS_MIN + BRIGHTNESS_MAX) / 2);
        return Math.round(BRIGHTNESS_MIN + (BRIGHTNESS_MAX - BRIGHTNESS_MIN) * (strength - min) / (max - min));
    };

    const handleImpulse = useCallback((strength: number, min: number, max: number) => {
        const now = Date.now();
        if (pulseInProgressRef.current || now - lastPulseTimeRef.current < 200) return;
        pulseInProgressRef.current = true;
        lastPulseTimeRef.current = now;
        const activeDevice = connectedDevices.find(d => d.id === activeDeviceId);
        if (activeDevice && activeDevice.controller) {
            const brightness = Math.max(31, Math.min(90, normalizeStrengthToBrightness(strength, min, max)));
            activeDevice.controller.pulseBrightness(brightness, 100).finally(() => {
                setTimeout(() => { pulseInProgressRef.current = false; }, 200);
            });
        } else {
            setTimeout(() => { pulseInProgressRef.current = false; }, 200);
        }
    }, [connectedDevices, activeDeviceId]);

    return (
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
            }}
        >
            <Typography variant="h6" sx={{ mb: 1 }}>
                Audio Chunker Demo
            </Typography>
            <Box sx={{ mb: 1, p: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
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
                    >
                        Choose File
                    </Button>
                    <Typography variant="body2" sx={{ ml: 1, minWidth: 120, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file ? file.name : 'No file chosen'}
                    </Typography>
                </Stack>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                {/* Left: controls and plot */}
                <Box sx={{ flex: 2, minWidth: 0, width: '100%' }}>
                    {audioUrl && (
                        <Box sx={{ mt: 2 }}>
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
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, mt: 2 }}>
                        <TextField
                            label="FFT Window Size (samples)"
                            type="number"
                            size="small"
                            value={windowSize}
                            onChange={e => setWindowSize(Number(e.target.value))}
                            inputProps={{ min: 128, step: 128, style: { width: 80 } }}
                        />
                        <TextField
                            label="Hop Size (samples)"
                            type="number"
                            size="small"
                            value={hopSize}
                            onChange={e => setHopSize(Number(e.target.value))}
                            inputProps={{ min: 1, step: 1, style: { width: 80 } }}
                        />
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleProcess}
                            disabled={!file || loading}
                        >
                            {loading ? 'Processing...' : 'Process Audio'}
                        </Button>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 2 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, ml: 0.5 }}>Time Window (seconds)</Typography>
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
                    </Stack>
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
                    {!loading && audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0 && audioData.analysis.audioBuffer && (
                        <AudioFrequencyVisualizer
                            fftSequence={audioData.analysis.fftSequence}
                            sampleRate={audioData.analysis.audioBuffer.sampleRate}
                            windowSize={windowSize}
                            hopSize={hopSize}
                            audioBuffer={audioData.analysis.audioBuffer}
                            playbackTime={playbackTime}
                            windowSec={windowSec}
                            followCursor={followCursor}
                            snapToWindow={snapToWindow}
                            showFirstDerivative={showFirstDerivative}
                            showSecondDerivative={showSecondDerivative}
                            showImpulses={showImpulses}
                            selectedBand={selectedBand}
                            onImpulse={handleImpulse}
                        />
                    )}
                </Box>
                {/* Right: Visualizer → Lights Connection Placeholder */}
                <Box sx={{ flex: 1, minWidth: 220, maxWidth: 320, width: '100%', ml: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <LightsConnectionCard
                        connectedDevices={connectedDevices}
                        activeDeviceId={activeDeviceId}
                        setActiveDeviceId={setActiveDeviceId}
                    />
                    <PulseToolsCard />
                </Box>
            </Box>
            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 120, my: 2, width: '100%' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2, mb: 2 }}>Processing audio...</Typography>
                    {processingProgress && (
                        <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={100 * processingProgress.processed / processingProgress.total}
                            />
                            <Typography variant="caption" sx={{ mt: 1 }}>
                                {`Processed ${processingProgress.processed} of ${processingProgress.total} chunks`}
                            </Typography>
                        </Box>
                    )}
                    {/* Skeletons for plot cards */}
                    <Box sx={{ width: '100%', maxWidth: 700 }}>
                        {[0,1,2,3,4].map(i => (
                            <Box key={i} sx={{ mb: 2 }}>
                                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 1 }} />
                                <Skeleton variant="text" width="40%" />
                                <Skeleton variant="text" width="60%" />
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
};

export default AudioChunkerDemo;
