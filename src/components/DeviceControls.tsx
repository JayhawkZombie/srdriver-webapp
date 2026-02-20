import { useState, useEffect } from "react";
import {
    Card,
    Stack,
    Text,
    Slider,
    Group,
    Button,
    SegmentedControl,
    TextInput,
    PasswordInput,
    Divider,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useDeviceContext } from "../contexts/DeviceContext";
import { WebSocketConnection } from "./WebSocketConnection";
import { FlatColorControls } from "./controls/FlatColorControls";
import { RainbowColorControls } from "./controls/RainbowColorControls";
import { ColorBlendControls } from "./controls/ColorBlendControls";
import { TwinkleEffectControls } from "./controls/TwinkleEffectControls";
import styles from "./DeviceControls.module.css";
import { RainEffectControls } from "./controls/RainEffectControls";
import { WaveEffectControls } from "./controls/WaveEffectControls";
import { PulsePlayerControls } from "./controls/PulsePlayerControls";

interface DeviceControlsProps {
    deviceId: string;
    onDisconnect: () => void;
}

const effectTabs = ["flat", "rainbow", "blend", "twinkling", "rain", "waves", "pulse", "misc"];
type EffectTab = (typeof effectTabs)[number];

export const DeviceControls: React.FC<DeviceControlsProps> = ({
    deviceId,
    onDisconnect,
}) => {
    const { getDevice } = useDeviceContext();
    const device = getDevice(deviceId);
    const srDriver = device?.srDriver;
    const deviceName = device?.name;
    const [brightness, setBrightness] = useState(128);
    const [ipAddress, setIPAddress] = useState<string | null>(null);
    const [wifiSSID, setWifiSSID] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [wifiStatus, setWifiStatus] = useState<string | null>(null);
    const [isWifiLoading, setIsWifiLoading] = useState(false);
    const [activeEffectTab, setActiveEffectTab] = useState<EffectTab>(
        effectTabs[0]
    );


    // Fetch IP address when component mounts
    useEffect(() => {
        const fetchIPAddress = async () => {
            if (srDriver) {
                try {
                    await srDriver.delayRequest(500);
                    const ip = await srDriver.getIPAddress();
                    setIPAddress(ip);
                } catch (error) {
                    console.log('IP address not available (older device)', error);
                    setIPAddress(null);
                }
            }
        };
        fetchIPAddress();
    }, [srDriver]);

    // Fetch WiFi status when component mounts
    useEffect(() => {
        const fetchWiFiStatus = async () => {
            if (srDriver) {
                try {
                    await srDriver.delayRequest(500);
                    const status = await srDriver.getWiFiStatus();
                    setWifiStatus(status);
                } catch (error) {
                    console.log('WiFi status not available (older device)');
                    setWifiStatus(null);
                }
            }
        };
        fetchWiFiStatus();
    }, [srDriver]);

    const handleBrightnessChange = async (value: number) => {
        if (!srDriver) return;

        try {
            await srDriver.setBrightness(value);
            setBrightness(value);
        } catch (error) {
            console.error("Failed to set brightness:", error);
        }
    };



    const handleWiFiSetup = async () => {
        if (!srDriver) return;

        setIsWifiLoading(true);
        try {
            await srDriver.setWiFiCredentials(wifiSSID, wifiPassword);
            console.log('✅ WiFi credentials sent successfully');
            
            // Refresh WiFi status after a short delay
            setTimeout(async () => {
                try {
                    const status = await srDriver.getWiFiStatus();
                    setWifiStatus(status);
                } catch (error) {
                    console.error('Failed to get WiFi status:', error);
                }
            }, 2000);
        } catch (error) {
            console.error('Failed to set WiFi credentials:', error);
        } finally {
            setIsWifiLoading(false);
        }
    };

    if (!srDriver) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text c="dimmed" ta="center">
                    No device connected
                </Text>
            </Card>
        );
    }

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder className={styles.deviceControlsContainer}>
            <Stack gap="md">
                <Group justify="space-between">
                    <Text fw={500}>{deviceName || "Device Controls"}</Text>
                    <Button
                        variant="light"
                        color="red"
                        size="xs"
                        leftSection={<IconX size={14} />}
                        onClick={onDisconnect}
                    >
                        Disconnect
                    </Button>
                </Group>

                {ipAddress ? (
                    <WebSocketConnection
                        srDriver={srDriver}
                        ipAddress={ipAddress}
                    />
                ) : (
                    <Text size="sm" c="dimmed">
                        WiFi not available (older device)
                    </Text>
                )}

                <Group gap="md" w="100%">
                    <Text size="sm" fw={500} w={100}>
                        Brightness
                    </Text>
                    <Slider
                        value={brightness}
                        onChange={handleBrightnessChange}
                        min={0}
                        max={255}
                        step={1}
                        style={{ flex: 1 }}
                        size="md"
                        color="blue"
                        marks={[
                            { value: 0, label: "0" },
                            { value: 128, label: "128" },
                            { value: 255, label: "255" },
                        ]}
                    />
                    <Text size="sm" c="dimmed" w={40}>
                        {brightness}
                    </Text>
                </Group>
                <SegmentedControl
                    value={activeEffectTab}
                    onChange={setActiveEffectTab}
                    data={effectTabs}
                />

                <div className={styles.controlsContainer}>
                    {activeEffectTab === "flat" && (
                        <FlatColorControls srDriver={srDriver} />
                    )}

                    {activeEffectTab === "rainbow" && (
                        <RainbowColorControls srDriver={srDriver} />
                    )}

                    {activeEffectTab === "blend" && (
                        <ColorBlendControls srDriver={srDriver} />
                    )}

                    {activeEffectTab === "twinkling" && (
                        <TwinkleEffectControls srDriver={srDriver} />
                    )}

                    {activeEffectTab === "rain" && (
                        <RainEffectControls srDriver={srDriver} />
                    )}

                    {activeEffectTab === "waves" && (
                        <WaveEffectControls srDriver={srDriver} />
                    )}

                    {activeEffectTab === "pulse" && (
                        <PulsePlayerControls srDriver={srDriver} />
                    )}

                </div>


                <Divider label="WiFi Setup" labelPosition="center" />

                {wifiStatus && (
                    <Text size="sm" c="dimmed">
                        WiFi Status: {wifiStatus}
                    </Text>
                )}

                <Stack gap="sm">
                    <TextInput
                        label="WiFi Network Name (SSID)"
                        placeholder="Enter WiFi network name"
                        value={wifiSSID}
                        onChange={(event) =>
                            setWifiSSID(event.currentTarget.value)
                        }
                        size="sm"
                    />
                    <PasswordInput
                        label="WiFi Password"
                        placeholder="Enter WiFi password"
                        value={wifiPassword}
                        onChange={(event) =>
                            setWifiPassword(event.currentTarget.value)
                        }
                        size="sm"
                    />
                    <Button
                        onClick={handleWiFiSetup}
                        loading={isWifiLoading}
                        disabled={!wifiSSID || !wifiPassword}
                        variant="filled"
                        color="green"
                        fullWidth
                        size="sm"
                    >
                        {isWifiLoading ? "Setting up WiFi..." : "Setup WiFi"}
                    </Button>
                </Stack>
            </Stack>
        </Card>
    );
};
