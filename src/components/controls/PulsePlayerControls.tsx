import React, { useState, useEffect } from "react";
import {
    Card,
    Stack,
    Text,
    Slider,
    Group,
    Button,
    ColorInput,
    SegmentedControl,
    TextInput,
    PasswordInput,
    Divider,
} from "@mantine/core";
import { IconX, IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { WebSocketConnection } from "./WebSocketConnection";

type Props = {
    srDriver: SRDriver | null;
};

export const PulsePlayerControls: React.FC<Props> = ({ srDriver }) => {
    const [pulsePlayerColor, setPulsePlayerColor] = useState("#ffffff");
    const [isLoading, setIsLoading] = useState(false);

    const handleShowPulsePlayerLEDs = async () => {
        if (!srDriver) return;

        setIsLoading(true);
        try {
            // Convert hex color to RGB
            const hex = pulsePlayerColor.replace("#", "");
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            // Send JSON command to show color LEDs (shortened field names)
            const command = JSON.stringify({
                t: "effect",
                e: {
                    t: "pulse",
                },
            });

            await srDriver.sendCommand(command);
            console.log("✅ Sent pulse player LED command:", command);
        } catch (error) {
            console.error("Failed to send pulse player LED command:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Group gap="md" w="100%">
            <Group gap="md" w="100%">
                <Text size="sm" fw={500} w={100}>
                    Pulse Player
                </Text>
                <ColorInput
                    value={pulsePlayerColor}
                    onChange={setPulsePlayerColor}
                    format="hex"
                    style={{ flex: 1 }}
                    size="md"
                    placeholder="Pick pulse player color"
                />
            </Group>

            <Button
                leftSection={<IconPalette size={16} />}
                onClick={handleShowPulsePlayerLEDs}
                loading={isLoading}
                variant="filled"
                color="blue"
                fullWidth
            >
                {isLoading ? "Sending..." : "Show Pulse Player LEDs"}
            </Button>
        </Group>
    );
};
