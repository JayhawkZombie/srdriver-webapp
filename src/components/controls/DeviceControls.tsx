import React, { useState, useEffect } from "react";
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
import { useDeviceControllerContext, useDeviceControllerMap } from '../../controllers/DeviceControllerContext';
import { useAppStore } from "../../store/appStore";
import type { DeviceUIState, AppState } from "../../store/appStore";
import { useShallow } from "zustand/react/shallow";
import type { SelectChangeEvent } from "@mui/material/Select";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import ColorPicker from './ColorPicker';

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
    "Flat Color",
];

interface DeviceControlsProps {
    deviceId: string;
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
}) => {
    const { devices } = useDeviceControllerContext();
    const { getController } = useDeviceControllerMap();
    const device = devices.find(d => d.browserId === deviceId);
    const controller = getController(deviceId);
    const deviceState = useAppStore(state => state.deviceState[deviceId]);
    const setDeviceState = useAppStore(state => state.setDeviceState);
    const { brightness, speed, patternIndex } = deviceState || { brightness: 128, speed: 1, patternIndex: 0 };
    const [pulseDuration, setPulseDuration] = useState<number>(1000);
    const [pulseTargetBrightness, setPulseTargetBrightness] = useState<number>(255);
    const [isPulsing, setIsPulsing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [firePatternIndex, setFirePatternIndex] = useState<number>(0);
    const [isFiringPattern, setIsFiringPattern] = useState<boolean>(false);
    const [patternArgument, setPatternArgument] = useState<string>("(255,255,255)-(0,0,0)");
    const [localHighColor, setLocalHighColor] = useState<string>(rgbToHex(device?.highColor || {r:255,g:255,b:255}));
    const [localLowColor, setLocalLowColor] = useState<string>(rgbToHex(device?.lowColor || {r:0,g:0,b:0}));

    useEffect(() => {
        setLocalHighColor(rgbToHex(device?.highColor || {r:255,g:255,b:255}));
        setLocalLowColor(rgbToHex(device?.lowColor || {r:0,g:0,b:0}));
    }, [device?.highColor, device?.lowColor]);

    const handleBrightnessChange = (
        event: Event | React.SyntheticEvent<Element, Event>,
        value: number | number[]
    ) => {
        const brightnessValue = value as number;
        setDeviceState(deviceId, { brightness: brightnessValue });
        if (controller && device?.isConnected) controller.setBrightness(brightnessValue);
    };

    const handleSpeedChange = (
        event: Event | React.SyntheticEvent<Element, Event>,
        value: number | number[]
    ) => {
        const speedValue = value as number;
        setDeviceState(deviceId, { speed: speedValue });
        if (controller && device?.isConnected) controller.setSpeed(speedValue);
    };

    const handlePatternChange = (event: SelectChangeEvent<number>) => {
        const patternIndexValue = Number(event.target.value);
        setDeviceState(deviceId, { patternIndex: patternIndexValue });
        if (controller && device?.isConnected) controller.setPattern(patternIndexValue);
    };

    // Pulse and fire pattern are UI-only for now (no BLE logic)
    const handlePulseBrightness = async () => {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), pulseDuration);
        if (controller && device?.isConnected) controller.pulseBrightness(pulseTargetBrightness, pulseDuration);
    };

    const handleFirePattern = async () => {
        setIsFiringPattern(true);
        setTimeout(() => setIsFiringPattern(false), 500);
        if (controller && device?.isConnected) controller.firePattern(firePatternIndex, patternArgument);
    };

    const handleApplyHighColor = () => {
        if (controller && device?.isConnected) controller.setHighColor(hexToRgb(localHighColor));
    };

    const handleApplyLowColor = () => {
        if (controller && device?.isConnected) controller.setLowColor(hexToRgb(localLowColor));
    };

    function hexToRgb(hex: string) {
        // Remove # if present
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(x => x + x).join('');
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
        };
    }

    function rgbToHex({r,g,b}:{r:number,g:number,b:number}) {
        return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
    }

    if (!device || !device.isConnected) return null;

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
                            value={brightness ?? 128}
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
                            value={speed ?? 1}
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
                                value={patternIndex ?? 0}
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
                                14, 15, 16, 17, 18
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
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, marginBottom: 2 }}>High Color</span>
                    <ColorPicker color={localHighColor} onChange={setLocalHighColor} />
                    <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={handleApplyHighColor}>Apply</Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, marginBottom: 2 }}>Low Color</span>
                    <ColorPicker color={localLowColor} onChange={setLocalLowColor} />
                    <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={handleApplyLowColor}>Apply</Button>
                </Box>
            </Box>
        </Box>
    );
};

export default DeviceControls;
