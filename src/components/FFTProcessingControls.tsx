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
} from "@mui/material";

const FFTProcessingControls: React.FC = () => {
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

    return (
        <Box
            sx={{
                mb: 2,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
            }}
        >
            <Typography variant="h6" sx={{ mb: 1 }}>
                FFT & Impulse Processing
            </Typography>
            <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Impulse Window Size</Typography>
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
                    valueLabelDisplay="on"
                />
            </Box>
            <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Impulse Smoothing</Typography>
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
                    valueLabelDisplay="on"
                />
            </Box>
            <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                    <InputLabel id="impulse-detection-mode-label">
                        Impulse Detection Mode
                    </InputLabel>
                    <Select
                        labelId="impulse-detection-mode-label"
                        value={impulseDetectionMode}
                        label="Impulse Detection Mode"
                        onChange={(e) =>
                            setImpulseDetectionMode(e.target.value as any)
                        }
                    >
                        <MenuItem value="second-derivative">
                            Second Derivative (default)
                        </MenuItem>
                        <MenuItem value="first-derivative">
                            First Derivative (rising edge)
                        </MenuItem>
                        <MenuItem value="z-score">
                            Z-Score (unusual change)
                        </MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};

export default FFTProcessingControls;
