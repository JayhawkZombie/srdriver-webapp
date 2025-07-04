import React, { useState } from "react";
import {
    Box,
    Typography,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    TextField,
    Button,
    Alert,
    Tooltip,
    IconButton,
    Chip,
} from "@mui/material";
import { useDeviceById } from "../../controllers/DeviceControllerContext";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { useAppStore } from "../../store/appStore";
import type { DeviceUIState, AppState } from "../../store/appStore";
import { useShallow } from "zustand/react/shallow";
import type { SelectChangeEvent } from "@mui/material/Select";

const patternNames = [
    "Pattern 0",
    "Pattern 1",
    "Pattern 2",
    "Pattern 3",
    "Pattern 4",
    "Pattern 5",
    "Pattern 6",
    "Pattern 7",
    "Pattern 8",
];

interface DeviceControlsProps {
    deviceId: string;
    onUpdate: (update: any) => void;
}

// Reusable labeled slider with optional tooltip
type LabeledSliderProps = {
    label: string;
    tooltip?: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (
        event: React.SyntheticEvent | Event,
        value: number | number[]
    ) => void;
    size?: "small" | "medium";
    sx?: object;
};
function LabeledSlider({
    label,
    tooltip,
    min,
    max,
    step = 1,
    value,
    onChange,
    size = "medium",
    sx = {},
}: LabeledSliderProps) {
    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                    variant="subtitle2"
                    sx={{ fontSize: size === "small" ? 12 : 16, mb: 0.5 }}
                >
                    {label}
                </Typography>
                {tooltip && (
                    <Tooltip title={tooltip}>
                        <IconButton size={size} sx={{ p: 0 }}>
                            <InfoOutlinedIcon
                                fontSize={size === "small" ? "small" : "medium"}
                            />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Slider
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                valueLabelDisplay="auto"
                size={size}
                sx={sx}
            />
        </Box>
    );
}

const DeviceControls: React.FC<DeviceControlsProps> = ({
    deviceId,
    onUpdate,
}) => {
    const device = useDeviceById(deviceId);
    const { brightness, speed, patternIndex } = useAppStore(
        useShallow((state: AppState) => {
            const dev = state.devices[deviceId] as DeviceUIState | undefined;
            return {
                brightness: dev?.brightness ?? device?.brightness ?? 128,
                speed: dev?.speed ?? device?.speed ?? 1,
                patternIndex: dev?.patternIndex ?? device?.patternIndex ?? 0,
            };
        })
    );
    const setDeviceState = useAppStore((state) => state.setDeviceState);
    const [pulseDuration, setPulseDuration] = useState<number>(1000);
    const [pulseTargetBrightness, setPulseTargetBrightness] =
        useState<number>(255);
    const [isPulsing, setIsPulsing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [firePatternIndex, setFirePatternIndex] = useState<number>(0);
    const [isFiringPattern, setIsFiringPattern] = useState<boolean>(false);
    const [patternArgument, setPatternArgument] = useState<string>(
        "(255,255,255)-(0,0,0)"
    );

    const handleBrightnessChange = (
        event: Event | React.SyntheticEvent<Element, Event>,
        value: number | number[]
    ) => {
        if (!device || !device.controller) return;
        const brightnessValue = value as number;
        setDeviceState(deviceId, { brightness: brightnessValue });
        onUpdate({ brightness: brightnessValue });
        device.controller.setBrightness(brightnessValue);
    };

    const handleSpeedChange = (
        event: Event | React.SyntheticEvent<Element, Event>,
        value: number | number[]
    ) => {
        if (!device || !device.controller) return;
        const speedValue = value as number;
        setDeviceState(deviceId, { speed: speedValue });
        onUpdate({ speed: speedValue });
        device.controller.setSpeed(speedValue);
    };

    const handlePatternChange = (event: SelectChangeEvent<number>) => {
        if (!device || !device.controller) return;
        const patternIndexValue = Number(event.target.value);
        setDeviceState(deviceId, { patternIndex: patternIndexValue });
        onUpdate({ patternIndex: patternIndexValue });
        device.controller.setPattern(patternIndexValue);
    };

    const handlePulseBrightness = async () => {
        if (!device || !device.controller) return;
        setIsPulsing(true);
        try {
            await device.controller.pulseBrightness(
                pulseTargetBrightness,
                pulseDuration
            );
        } catch (e) {
            setError((e as Error).message || "Failed to pulse brightness");
        } finally {
            setIsPulsing(false);
        }
    };

    const handleFirePattern = async () => {
        if (!device || !device.controller) return;
        setIsFiringPattern(true);
        setError(null);
        try {
            console.log(
                "Firing pattern with argument",
                firePatternIndex,
                patternArgument
            );
            await device.controller.firePattern(
                firePatternIndex,
                patternArgument
            );
        } catch (e) {
            setError((e as Error).message || "Failed to fire pattern");
        } finally {
            setIsFiringPattern(false);
        }
    };

    if (!device || !device.isConnected || !device.controller) return null;

    // Helper for RTT color
    const getLatencyColor = (rtt?: number) => {
        if (rtt === undefined) return "default";
        if (rtt < 50) return "success";
        if (rtt < 150) return "warning";
        return "error";
    };

    return (
        <Box sx={{ mt: 1, p: 0, gap: 1, display: "flex", flexDirection: "column" }}>
            {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {error}
                </Alert>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1,
                        alignItems: "center",
                        p: 2,
                        background: "rgba(0,0,0,0.10)",
                        borderRadius: 2,
                        width: "100%",
                        maxWidth: 320,
                        overflow: "hidden",
                        boxSizing: "border-box",
                    }}
                >
                    <Box sx={{ width: "100%", minWidth: 0, p: 0, m: 0 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                mb: 0.5,
                            }}
                        >
                            <LightbulbOutlinedIcon
                                fontSize="small"
                                sx={{ color: "text.secondary" }}
                            />
                        </Box>
                        <LabeledSlider
                            label=""
                            min={0}
                            max={255}
                            value={brightness}
                            onChange={handleBrightnessChange}
                            size="small"
                            sx={{
                                height: 18,
                                minWidth: 0,
                                maxWidth: 120,
                                width: "100%",
                                fontSize: 10,
                                p: 0,
                                m: 0,
                            }}
                        />
                    </Box>
                    <Box sx={{ width: "100%", minWidth: 0, p: 0, m: 0 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                mb: 0.5,
                            }}
                        >
                            <SpeedOutlinedIcon
                                fontSize="small"
                                sx={{ color: "text.secondary" }}
                            />
                        </Box>
                        <LabeledSlider
                            label=""
                            min={0}
                            max={255}
                            value={speed}
                            onChange={handleSpeedChange}
                            size="small"
                            sx={{
                                height: 18,
                                minWidth: 0,
                                maxWidth: 120,
                                width: "100%",
                                fontSize: 10,
                                p: 0,
                                m: 0,
                            }}
                        />
                    </Box>
                    <Box sx={{ width: "100%" }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontSize: 12, mb: 0.5 }}
                        >
                            Pattern
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                            <InputLabel
                                id="pattern-select-label"
                                sx={{ fontSize: 12 }}
                            >
                                Pattern
                            </InputLabel>
                            <Select
                                labelId="pattern-select-label"
                                onChange={handlePatternChange}
                                value={patternIndex}
                                label="Pattern"
                                sx={{ fontSize: 12 }}
                            >
                                {patternNames.map((name, idx) => (
                                    <MenuItem
                                        key={idx}
                                        value={idx}
                                        sx={{ fontSize: 12 }}
                                    >
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ width: "100%" }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontSize: 12, mb: 0.5 }}
                        >
                            Pulse
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                                width: "100%",
                            }}
                        >
                            <LabeledSlider
                                label="Target"
                                min={0}
                                max={255}
                                value={pulseTargetBrightness}
                                onChange={(e, v) =>
                                    setPulseTargetBrightness(Number(v))
                                }
                                size="small"
                                sx={{
                                    height: 18,
                                    minWidth: 0,
                                    maxWidth: 120,
                                    width: "100%",
                                    fontSize: 10,
                                    p: 0,
                                    m: 0,
                                }}
                            />
                            <LabeledSlider
                                label="Duration (ms)"
                                min={10}
                                max={10000}
                                step={10}
                                value={pulseDuration}
                                onChange={(e, v) => setPulseDuration(Number(v))}
                                size="small"
                                sx={{
                                    height: 18,
                                    minWidth: 0,
                                    maxWidth: 120,
                                    width: "100%",
                                    fontSize: 10,
                                    p: 0,
                                    m: 0,
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handlePulseBrightness}
                                disabled={isPulsing}
                                size="small"
                                sx={{
                                    minWidth: 32,
                                    px: 1,
                                    fontSize: 12,
                                    alignSelf: "flex-start",
                                }}
                            >
                                {isPulsing ? "..." : "Go"}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    alignItems: "flex-start",
                    p: 2,
                    background: "rgba(0,0,0,0.10)",
                    borderRadius: 2,
                    width: "100%",
                    maxWidth: 320,
                    overflow: "hidden",
                    boxSizing: "border-box",
                }}
            >
                <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>
                    Test Patterns
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 60 }}>
                        <Select
                            value={firePatternIndex}
                            onChange={(e) =>
                                setFirePatternIndex(Number(e.target.value))
                            }
                            sx={{ fontSize: 12 }}
                        >
                            {[
                                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
                                14, 15, 16, 17,
                            ].map((idx) => (
                                <MenuItem
                                    key={idx}
                                    value={idx}
                                    sx={{ fontSize: 12 }}
                                >{`Pattern ${idx}`}</MenuItem>
                            ))}
                        </Select>
                        <TextField
                            label="Argument"
                            value={patternArgument}
                            onChange={(e) => setPatternArgument(e.target.value)}
                            size="small"
                            sx={{ mt: 0.5 }}
                            fullWidth
                        />
                    </FormControl>
                    <Button
                        variant="contained"
                        onClick={handleFirePattern}
                        disabled={isFiringPattern}
                        size="small"
                        sx={{ minWidth: 0, px: 1, fontSize: 12 }}
                    >
                        {isFiringPattern ? "..." : "Fire"}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
};

export default DeviceControls;
