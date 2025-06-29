import React from "react";
import { useAppStore } from "../store/appStore";
import {
    Box,
    Typography,
    Slider,
    FormControl,
    Select,
    MenuItem,
    TextField
} from "@mui/material";
import Tooltip from '@mui/material/Tooltip';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import FunctionsIcon from '@mui/icons-material/Functions';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { SelectChangeEvent } from '@mui/material/Select';

interface FFTProcessingControlsProps {
    windowSize: number;
    setWindowSize: (n: number) => void;
    hopSize: number;
    setHopSize: (n: number) => void;
    fileLoaded: boolean;
}

const FFTProcessingControls: React.FC<FFTProcessingControlsProps> = ({ windowSize, setWindowSize, hopSize, setHopSize, fileLoaded }) => {
    const impulseWindowSize = useAppStore((state) => state.impulseWindowSize);
    const setImpulseWindowSize = useAppStore(
        (state) => state.setImpulseWindowSize
    );
    const impulseSmoothing = useAppStore((state) => state.impulseSmoothing);
    const setImpulseSmoothing = useAppStore(
        (state) => state.setImpulseSmoothing
    );
    const impulseDetectionMode = useAppStore(
        (state) => state.impulseDetectionMode
    );
    const derivativeMode = useAppStore((state) => state.derivativeMode || 'centered');
    const setDerivativeMode = useAppStore((state) => state.setDerivativeMode);
    const disabled = !fileLoaded;
    const spectralFluxWindow = useAppStore((state) => state.spectralFluxWindow);
    const setSpectralFluxWindow = useAppStore((state) => state.setSpectralFluxWindow);
    const spectralFluxK = useAppStore((state) => state.spectralFluxK);
    const setSpectralFluxK = useAppStore((state) => state.setSpectralFluxK);
    const spectralFluxMinSeparation = useAppStore((state) => state.spectralFluxMinSeparation);
    const setSpectralFluxMinSeparation = useAppStore((state) => state.setSpectralFluxMinSeparation);
    const detectionMethod = impulseDetectionMode;
    const minDb = useAppStore((state) => state.minDb);
    const setMinDb = useAppStore((state) => state.setMinDb);
    const minDbDelta = useAppStore((state) => state.minDbDelta);
    const setMinDbDelta = useAppStore((state) => state.setMinDbDelta);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, p: 0, m: 0, opacity: disabled ? 0.5 : 1 }}>
            {detectionMethod === 'spectral-flux' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, ml: 1 }}>
                    <Tooltip title="Window size for adaptive threshold (median/MAD). Larger = more context, less sensitive."
                        enterDelay={400}
                        leaveDelay={100}
                        disableFocusListener
                        disableTouchListener
                    >
                        <span>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CropLandscapeIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ minWidth: 24 }}>Win</Typography>
                                <Slider
                                    min={5}
                                    max={101}
                                    step={2}
                                    value={spectralFluxWindow}
                                    onChange={(_event: Event, v) => setSpectralFluxWindow(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 21))}
                                    valueLabelDisplay="auto"
                                    size="small"
                                    sx={{ width: 60, ml: 1 }}
                                    disabled={disabled}
                                />
                            </Box>
                        </span>
                    </Tooltip>
                    <Tooltip title="Threshold multiplier (k) for adaptive threshold: median + k × MAD. Higher = fewer impulses."
                        enterDelay={400}
                        leaveDelay={100}
                        disableFocusListener
                        disableTouchListener
                    >
                        <span>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FunctionsIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ minWidth: 24 }}>k</Typography>
                                <Slider
                                    min={0.5}
                                    max={5}
                                    step={0.1}
                                    value={spectralFluxK}
                                    onChange={(_event: Event, v) => setSpectralFluxK(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 2))}
                                    valueLabelDisplay="auto"
                                    size="small"
                                    sx={{ width: 60, ml: 1 }}
                                    disabled={disabled}
                                />
                            </Box>
                        </span>
                    </Tooltip>
                    <Tooltip title="Minimum frames between impulses. Higher = more separation, fewer impulses."
                        enterDelay={400}
                        leaveDelay={100}
                        disableFocusListener
                        disableTouchListener
                    >
                        <span>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ minWidth: 24 }}>Sep</Typography>
                                <Slider
                                    min={1}
                                    max={20}
                                    step={1}
                                    value={spectralFluxMinSeparation}
                                    onChange={(_event: Event, v) => setSpectralFluxMinSeparation(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 3))}
                                    valueLabelDisplay="auto"
                                    size="small"
                                    sx={{ width: 60, ml: 1 }}
                                    disabled={disabled}
                                />
                            </Box>
                        </span>
                    </Tooltip>
                </Box>
            )}
            {detectionMethod !== 'spectral-flux' && (
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, ml: 1 }}>
                    <Tooltip title={<>
                        <b>Derivative Mode:</b><br/>
                        <b>Centered</b>: (default) Slope between points before/after, best for local rate of change.<br/>
                        <b>Forward</b>: Difference from previous window (step-like for large window).<br/>
                        <b>Moving Avg</b>: Average of differences over window (smooth, slightly lagged).
                    </>} placement="top" arrow
                        enterDelay={400}
                        leaveDelay={100}
                        disableFocusListener
                        disableTouchListener
                    >
                        <span>
                            <FormControl size="small" sx={{ minWidth: 120 }} disabled={disabled}>
                                <Select
                                    value={derivativeMode}
                                    onChange={(e: SelectChangeEvent) => setDerivativeMode(e.target.value as 'forward' | 'centered' | 'moving-average')}
                                    displayEmpty
                                    disabled={disabled}
                                >
                                    <MenuItem value="centered">Centered</MenuItem>
                                    <MenuItem value="forward">Forward</MenuItem>
                                    <MenuItem value="moving-average">Moving Avg</MenuItem>
                                </Select>
                            </FormControl>
                        </span>
                    </Tooltip>
                    <Tooltip title="Derivative window size: how many frames apart to compare for rate of change. Larger = less sensitive, smoother derivative."
                        enterDelay={400}
                        leaveDelay={100}
                        disableFocusListener
                        disableTouchListener
                    >
                        <span>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CropLandscapeIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ minWidth: 24 }}>Win</Typography>
                                <Slider
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={impulseWindowSize}
                                    onChange={(_event: Event, v) => setImpulseWindowSize(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 1))}
                                    valueLabelDisplay="auto"
                                    size="small"
                                    sx={{ width: 60, ml: 1 }}
                                    disabled={disabled}
                                />
                            </Box>
                        </span>
                    </Tooltip>
                </Box>
            )}
            <Tooltip title="Smoothing window: moving average applied to the magnitude curve before detection. Larger = smoother, less sensitive to noise."
                enterDelay={400}
                leaveDelay={100}
                disableFocusListener
                disableTouchListener
            >
                <span>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                        <FunctionsIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ minWidth: 24 }}>Smooth</Typography>
                        <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={impulseSmoothing}
                            onChange={(_event: Event, v) => setImpulseSmoothing(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 1))}
                            valueLabelDisplay="auto"
                            size="small"
                            sx={{ width: 60, ml: 1 }}
                            disabled={disabled}
                        />
                    </Box>
                </span>
            </Tooltip>
            <Tooltip title="Minimum dB (ignore background noise)"
                enterDelay={400}
                leaveDelay={100}
                disableFocusListener
                disableTouchListener
            >
                <span>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                        <VolumeUpIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                        <Slider
                            min={-80}
                            max={0}
                            step={1}
                            value={minDb}
                            onChange={(_event: Event, v) => setMinDb(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : -60))}
                            valueLabelDisplay="auto"
                            size="small"
                            sx={{ width: 60, ml: 1 }}
                            disabled={disabled}
                        />
                    </Box>
                </span>
            </Tooltip>
            <Tooltip title="Minimum dB Change (only count big jumps)"
                enterDelay={400}
                leaveDelay={100}
                disableFocusListener
                disableTouchListener
            >
                <span>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                        <TrendingUpIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                        <Slider
                            min={0}
                            max={20}
                            step={0.5}
                            value={minDbDelta}
                            onChange={(_event: Event, v) => setMinDbDelta(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 3))}
                            valueLabelDisplay="auto"
                            size="small"
                            sx={{ width: 60, ml: 1 }}
                            disabled={disabled}
                        />
                    </Box>
                </span>
            </Tooltip>
            <TextField
                label="FFT Window"
                type="number"
                size="small"
                value={windowSize}
                onChange={e => setWindowSize(Number(e.target.value))}
                inputProps={{ min: 256, max: 8192, step: 256, style: { width: 70 } }}
                sx={{ width: 110 }}
                disabled={disabled}
            />
            <TextField
                label="Hop Size"
                type="number"
                size="small"
                value={hopSize}
                onChange={e => setHopSize(Number(e.target.value))}
                inputProps={{ min: 32, max: 4096, step: 32, style: { width: 70 } }}
                sx={{ width: 110 }}
                disabled={disabled}
            />
        </Box>
    );
};

export default FFTProcessingControls;
