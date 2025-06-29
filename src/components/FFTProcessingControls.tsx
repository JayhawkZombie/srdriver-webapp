import React from "react";
import { useAppStore } from "../store/appStore";
import {
    Box,
    Typography,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import FunctionsIcon from '@mui/icons-material/Functions';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
    const setImpulseDetectionMode = useAppStore(
        (state) => state.setImpulseDetectionMode
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
    const setDetectionMethod = setImpulseDetectionMode;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, p: 0, m: 0, opacity: disabled ? 0.5 : 1 }}>
            <FormControl size="small" sx={{ minWidth: 150 }} disabled={disabled}>
                <Select
                    value={detectionMethod}
                    onChange={(e) => setDetectionMethod(e.target.value as any)}
                    displayEmpty
                    disabled={disabled}
                >
                    <MenuItem value="spectral-flux">Spectral Flux</MenuItem>
                    <MenuItem value="first-derivative">1st Derivative</MenuItem>
                    <MenuItem value="second-derivative">2nd Derivative</MenuItem>
                    <MenuItem value="z-score">Z-Score (Derivative)</MenuItem>
                </Select>
            </FormControl>
            {detectionMethod === 'spectral-flux' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, ml: 1 }}>
                    <Tooltip title="Window size for adaptive threshold (median/MAD). Larger = more context, less sensitive."><span>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CropLandscapeIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ minWidth: 24 }}>Win</Typography>
                            <Slider
                                min={5}
                                max={101}
                                step={2}
                                value={spectralFluxWindow}
                                onChange={(_, v) => setSpectralFluxWindow(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 21))}
                                valueLabelDisplay="auto"
                                size="small"
                                sx={{ width: 60, ml: 1 }}
                                disabled={disabled}
                            />
                        </Box>
                    </span></Tooltip>
                    <Tooltip title="Threshold multiplier (k) for adaptive threshold: median + k × MAD. Higher = fewer impulses."><span>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FunctionsIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ minWidth: 24 }}>k</Typography>
                            <Slider
                                min={0.5}
                                max={5}
                                step={0.1}
                                value={spectralFluxK}
                                onChange={(_, v) => setSpectralFluxK(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 2))}
                                valueLabelDisplay="auto"
                                size="small"
                                sx={{ width: 60, ml: 1 }}
                                disabled={disabled}
                            />
                        </Box>
                    </span></Tooltip>
                    <Tooltip title="Minimum frames between impulses. Higher = more separation, fewer impulses."><span>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ minWidth: 24 }}>Sep</Typography>
                            <Slider
                                min={1}
                                max={20}
                                step={1}
                                value={spectralFluxMinSeparation}
                                onChange={(_, v) => setSpectralFluxMinSeparation(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 3))}
                                valueLabelDisplay="auto"
                                size="small"
                                sx={{ width: 60, ml: 1 }}
                                disabled={disabled}
                            />
                        </Box>
                    </span></Tooltip>
                </Box>
            )}
            {detectionMethod !== 'spectral-flux' && (
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, ml: 1 }}>
                    <Tooltip title={<>
                        <b>Derivative Mode:</b><br/>
                        <b>Centered</b>: (default) Slope between points before/after, best for local rate of change.<br/>
                        <b>Forward</b>: Difference from previous window (step-like for large window).<br/>
                        <b>Moving Avg</b>: Average of differences over window (smooth, slightly lagged).
                    </>} placement="top" arrow>
                        <FormControl size="small" sx={{ minWidth: 120 }} disabled={disabled}>
                            <Select
                                value={derivativeMode}
                                onChange={(e) => setDerivativeMode(e.target.value as any)}
                                displayEmpty
                                disabled={disabled}
                            >
                                <MenuItem value="centered">Centered</MenuItem>
                                <MenuItem value="forward">Forward</MenuItem>
                                <MenuItem value="moving-average">Moving Avg</MenuItem>
                            </Select>
                        </FormControl>
                    </Tooltip>
                    <Tooltip title="Derivative window size: how many frames apart to compare for rate of change. Larger = less sensitive, smoother derivative."><span>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CropLandscapeIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ minWidth: 24 }}>Win</Typography>
                            <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={impulseWindowSize}
                                onChange={(_, v) => setImpulseWindowSize(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 1))}
                                valueLabelDisplay="auto"
                                size="small"
                                sx={{ width: 60, ml: 1 }}
                                disabled={disabled}
                            />
                        </Box>
                    </span></Tooltip>
                </Box>
            )}
            <Tooltip title="Smoothing window: moving average applied to the magnitude curve before detection. Larger = smoother, less sensitive to noise."><span>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                    <FunctionsIcon fontSize="small" sx={{ verticalAlign: 'middle', color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ minWidth: 24 }}>Smooth</Typography>
                    <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={impulseSmoothing}
                        onChange={(_, v) => setImpulseSmoothing(typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 1))}
                        valueLabelDisplay="auto"
                        size="small"
                        sx={{ width: 60, ml: 1 }}
                        disabled={disabled}
                    />
                </Box>
            </span></Tooltip>
            <TextField
                label="FFT Window"
                type="number"
                size="small"
                value={windowSize}
                onChange={e => setWindowSize(Number(e.target.value))}
                inputProps={{ min: 128, step: 128, style: { width: 70 } }}
                sx={{ width: 110 }}
                disabled={disabled}
            />
            <TextField
                label="Hop Size"
                type="number"
                size="small"
                value={hopSize}
                onChange={e => setHopSize(Number(e.target.value))}
                inputProps={{ min: 1, step: 1, style: { width: 70 } }}
                sx={{ width: 110 }}
                disabled={disabled}
            />
        </Box>
    );
};

export default FFTProcessingControls;
