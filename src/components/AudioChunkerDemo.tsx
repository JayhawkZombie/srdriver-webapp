import React, { useEffect, createContext, useContext } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    FormControlLabel,
    Checkbox,
    Slider} from '@mui/material';
// Import worker (Vite/CRA style)
// @ts-expect-error "needed import for audioWorker"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import audioWorkerUrl from '../workers/audioWorker.ts?worker';
import GlobalControls from './GlobalControls';
import DerivativeImpulseToggles from './controls/DerivativeImpulseToggles';
import BandSelector from './visuals/BandSelector';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { PulseToolsProvider } from '../controllers/PulseToolsContext';
// @ts-expect-error "needed import for visualizationWorker"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import visualizationWorkerUrl from '../controllers/visualizationWorker.ts?worker';
import FFTProcessingControls from './controls/FFTProcessingControls';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Tooltip from '@mui/material/Tooltip';
import { useAppStore } from '../store/appStore';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import SpectrogramTimeline from "./spectrogram-timeline/SpectrogramTimeline";
import AudioFileControls from './AudioFileControls';

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

interface AudioChunkerDemoProps {
    onImpulse?: (strength: number, min: number, max: number, bandName?: string, time?: number) => void;
}

const AudioChunkerDemo: React.FC<AudioChunkerDemoProps> = () => {
    const file = useAppStore(state => state.file);
    const setFile = useAppStore(state => state.setFile);
    const windowSize = useAppStore(state => state.windowSize);
    const setWindowSize = useAppStore(state => state.setWindowSize);
    const hopSize = useAppStore(state => state.hopSize);
    const setHopSize = useAppStore(state => state.setHopSize);
    const setAudioUrl = useAppStore(state => state.setAudioUrl);
    const hasProcessedOnce = useAppStore(state => state.hasProcessedOnce);
    const isProcessingStale = useAppStore(state => state.isProcessingStale);
    const followCursor = useAppStore(state => state.followCursor);
    const setFollowCursor = useAppStore(state => state.setFollowCursor);
    const snapToWindow = useAppStore(state => state.snapToWindow);
    const setSnapToWindow = useAppStore(state => state.setSnapToWindow);
    const windowSec = useAppStore(state => state.windowSec);
    const setWindowSec = useAppStore(state => state.setWindowSec);
    const selectedBand = useAppStore(state => state.selectedBand);
    const setSelectedBand = useAppStore(state => state.setSelectedBand);
    const { devices } = useDeviceControllerContext();
    const connectedDevices = devices.filter(d => d.isConnected);
    const activeDeviceId = useAppStore(state => state.activeDeviceId);
    const setActiveDeviceId = useAppStore(state => state.setActiveDeviceId);
    const { audioData, setAudioData } = useAppStore();
    const showSustainedImpulses = useAppStore(state => state.showSustainedImpulses);
    const setShowSustainedImpulses = useAppStore(state => state.setShowSustainedImpulses);
    const onlySustained = useAppStore(state => state.onlySustained);
    const setOnlySustained = useAppStore(state => state.setOnlySustained);
    const setProcessingProgress = useAppStore(state => state.setProcessingProgress);

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
        setProcessingProgress(null);
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
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                        {/* Left: controls and plot */}
                        <Box sx={{ flex: 2, minWidth: 0, width: '100%' }}>
                            {/* Modern, compact horizontal toolbar for all top controls */}
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2, mt: 1 }}>
                                <AudioFileControls />
                                {/* Detection engine selector */}

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
                            {audioData.analysis && audioData.analysis.summary && (
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, mb: 1 }}>
                                    {typeof audioData.analysis.summary.numChunks === 'number' && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Chunks:</strong> {audioData.analysis.summary.numChunks}
                                        </Typography>
                                    )}
                                    {typeof audioData.analysis.summary.chunkDurationMs === 'number' && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Chunk:</strong> {audioData.analysis.summary.chunkDurationMs.toFixed(2)} ms
                                        </Typography>
                                    )}
                                    {typeof audioData.analysis.summary.totalDurationMs === 'number' && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Total:</strong> {audioData.analysis.summary.totalDurationMs.toFixed(2)} ms
                                        </Typography>
                                    )}
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
                            <SpectrogramTimeline />
                        </Box>
                    </Box>
                    {/* Button to manually clear app state from IndexedDB */}
                    <Button variant="outlined" color="error" size="small" onClick={handleClearAppState} sx={{ mb: 1 }}>
                        Clear Audio Data
                    </Button>
                </Paper>
            </PulseToolsProvider>
        </ActiveDeviceContext.Provider>
    );
};

export default AudioChunkerDemo;
