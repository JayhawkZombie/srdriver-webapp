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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, p: 0, m: 0, opacity: disabled ? 0.5 : 1 }}>
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
            <Typography variant="caption" sx={{ minWidth: 40 }}>Win</Typography>
            <Slider
                min={1}
                max={10}
                step={1}
                value={impulseWindowSize}
                onChange={(_, v) =>
                    setImpulseWindowSize(
                        typeof v === "number"
                            ? v
                            : Array.isArray(v)
                            ? v[0]
                            : 1
                    )
                }
                valueLabelDisplay="auto"
                size="small"
                sx={{ width: 60 }}
                disabled={disabled}
            />
            <Typography variant="caption" sx={{ minWidth: 40 }}>Smooth</Typography>
            <Slider
                min={1}
                max={10}
                step={1}
                value={impulseSmoothing}
                onChange={(_, v) =>
                    setImpulseSmoothing(
                        typeof v === "number"
                            ? v
                            : Array.isArray(v)
                            ? v[0]
                            : 1
                    )
                }
                valueLabelDisplay="auto"
                size="small"
                sx={{ width: 60 }}
                disabled={disabled}
            />
            <FormControl size="small" sx={{ minWidth: 120 }} disabled={disabled}>
                <Select
                    value={impulseDetectionMode}
                    onChange={(e) =>
                        setImpulseDetectionMode(e.target.value as any)
                    }
                    displayEmpty
                    disabled={disabled}
                >
                    <MenuItem value="second-derivative">2nd Deriv</MenuItem>
                    <MenuItem value="first-derivative">1st Deriv</MenuItem>
                    <MenuItem value="z-score">Z-Score</MenuItem>
                </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
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
                <Tooltip title={
                    <>
                        <b>Derivative Mode:</b><br/>
                        <b>Centered</b>: (default) Slope between points before/after, best for local rate of change.<br/>
                        <b>Forward</b>: Difference from previous window (step-like for large window).<br/>
                        <b>Moving Avg</b>: Average of differences over window (smooth, slightly lagged).
                    </>
                } placement="top" arrow>
                    <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary', cursor: 'pointer' }} />
                </Tooltip>
            </Box>
        </Box>
    );
};

export default FFTProcessingControls;
