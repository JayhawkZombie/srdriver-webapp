import { useState } from "react";
import {
    Button,
    Stack,
    Text,
    Alert,
    Group,
    Title,
    TextInput,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useDeviceContext } from "../contexts/DeviceContext";
import { DeviceControls } from "./DeviceControls";
import styles from "./generic-controls/ConnectionButton.module.css";
import { useAppStore } from "../stores/appStore";

export const ConnectionButton = () => {
    const {
        devices,
        connectDeviceBLE,
        connectDeviceWebSocket,
        disconnectDevice,
        isConnecting,
        error,
    } = useDeviceContext();

    const [wsIP, setWsIP] = useState("");

    const addDeviceToHistory = useAppStore((state) => state.addDeviceToHistory);

    const handleBLEConnect = async () => {
        await connectDeviceBLE(async (info) => {
            addDeviceToHistory({
                id: info.id,
                name: info.name,
                ipAddress: null,
                connectionType: "ble",
                lastConnected: new Date().toISOString(),
            });
        });
    };

    const handleWSConnect = async () => {
        console.log("WANT TO CONNECT TO WEBSOCKET", wsIP.trim());
        if (wsIP.trim()) {
            const ipToConnect = wsIP.trim();
            await connectDeviceWebSocket(ipToConnect, async (info) => {
                console.log("WANT TO ADD DEVICE TO HISTORY", info);
                const driver = info.srDriver;
                // Use the IP we connected with directly, matching WebSocketConnection pattern
                addDeviceToHistory({
                    id: driver.getDeviceId(),
                    name: `SRDriver`,
                    ipAddress: ipToConnect,
                    connectionType: "websocket",
                    lastConnected: new Date().toISOString(),
                });
            });
            setWsIP(""); // Clear the input after successful connection
        }
    };

    return (
        <Stack gap="md" miw={200} className={styles.connectionButtonContainer}>
            {error && (
                <Alert color="red" variant="light">
                    {error}
                </Alert>
            )}

            <Group justify="space-between" align="center">
                <Title order={3}>Connected Devices ({devices.length})</Title>
            </Group>

            <Group gap="md">
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleBLEConnect}
                    loading={isConnecting}
                    color="blue"
                    variant="filled"
                    size="sm"
                >
                    Connect BLE
                </Button>

                <TextInput
                    placeholder="IP Address (e.g., 192.168.1.100)"
                    value={wsIP}
                    onChange={(e) => setWsIP(e.target.value)}
                    size="sm"
                    style={{ flex: 1 }}
                />
                <Button
                    onClick={handleWSConnect}
                    loading={isConnecting}
                    disabled={!wsIP.trim()}
                    color="green"
                    variant="filled"
                    size="sm"
                >
                    Connect WebSocket
                </Button>
            </Group>

            {devices.length === 0 && (
                <Text size="sm" c="dimmed" ta="center">
                    No devices connected. Use the buttons above to connect to an
                    SRDriver.
                </Text>
            )}

            {devices.map((device) => (
                <DeviceControls
                    key={device.id}
                    deviceId={device.id}
                    onDisconnect={() => disconnectDevice(device.id)}
                />
            ))}
        </Stack>
    );
};
