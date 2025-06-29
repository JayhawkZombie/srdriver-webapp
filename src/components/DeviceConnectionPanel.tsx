import React from "react";
import { Box, Typography, Button } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AnimatedStatusChip from "./AnimatedStatusChip";
import {
    useDeviceControllerContext,
    useHeartbeatStatus,
} from "../controllers/DeviceControllerContext";
import { Device } from "../types/Device";

const DeviceConnectionRow: React.FC<{
    device: Device;
    connectDevice: (id: string) => void;
    disconnectDevice: (id: string) => void;
}> = ({ device, connectDevice, disconnectDevice }) => {
    const heartbeat = useHeartbeatStatus(device.id);
    const prevPulse = React.useRef<number | null>(null);
    console.log("Row render", device.id, heartbeat);
    React.useEffect(() => {
        if (heartbeat?.pulse && heartbeat.pulse !== prevPulse.current) {
            console.log("Heartbeat!", device.id);
        }
        prevPulse.current = heartbeat?.pulse ?? null;
    }, [heartbeat?.pulse, device.id]);
    return (
        <Box
            key={device.id}
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
        >
            <Typography variant="body1">{device.name}</Typography>
            <AnimatedStatusChip
                key={heartbeat?.pulse ?? "pulse-off"}
                label={
                    device.isConnected
                        ? "Connected"
                        : device.isConnecting
                        ? "Connecting..."
                        : "Disconnected"
                }
                color={
                    device.isConnected
                        ? "success"
                        : device.isConnecting
                        ? "warning"
                        : "default"
                }
                size="small"
                isActive={!!heartbeat?.isAlive}
                pulse={heartbeat?.pulse != null}
                icon={
                    <FavoriteIcon
                        fontSize="small"
                        color={heartbeat?.isAlive ? "error" : "disabled"}
                    />
                }
            />
            {device.isConnected ? (
                <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => disconnectDevice(device.id)}
                    disabled={device.isConnecting}
                >
                    Disconnect
                </Button>
            ) : (
                <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => connectDevice(device.id)}
                    disabled={device.isConnecting}
                >
                    {device.isConnecting ? "Connecting..." : "Connect"}
                </Button>
            )}
        </Box>
    );
};

const DeviceConnectionPanel = () => {
    const { devices, connectDevice, disconnectDevice } =
        useDeviceControllerContext();

    if (!devices || devices.length === 0) return null;

    return (
        <div>
            {devices.map((device: Device) => (
                <DeviceConnectionRow
                    key={device.id}
                    device={device}
                    connectDevice={connectDevice}
                    disconnectDevice={disconnectDevice}
                />
            ))}
        </div>
    );
};

export default DeviceConnectionPanel;
