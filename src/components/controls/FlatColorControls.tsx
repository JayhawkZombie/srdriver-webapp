import React, { useState } from "react";
import {
    Text,
    Group,
    Button,
    ColorInput,
} from "@mantine/core";
import { IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";

type Props = {
    srDriver: SRDriver | null;
};

export const FlatColorControls: React.FC<Props> = ({
    srDriver,
}) => {
    const [color, setColor] = useState("#ffffff");
    const [isLoading, setIsLoading] = useState(false);

        const handleShowColorLEDs = async () => {
        if (!srDriver) return;

        setIsLoading(true);
        try {
            // Convert hex color to RGB
            const hex = color.replace("#", "");
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            // Send JSON command to show color LEDs (shortened field names)
            const command = JSON.stringify({
                t: "effect",
                e: {
                    t: "solid_color",
                    p: {
                        c: `rgb(${r},${g},${b})`,
                        d: -1,
                    },
                },
            });

            await srDriver.sendCommand(command);
            console.log("✅ Sent color LED command:", command);
        } catch (error) {
            console.error("Failed to send color LED command:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Group gap="md" w="100%">
            <Group gap="md" w="100%">
                <Text size="sm" fw={500} w={100}>
                    Color
                </Text>
                <ColorInput
                    value={color}
                    onChange={setColor}
                    format="hex"
                    style={{ flex: 1 }}
                    size="md"
                    placeholder="Pick color"
                />
            </Group>

            <Button
                leftSection={<IconPalette size={16} />}
                onClick={handleShowColorLEDs}
                loading={isLoading}
                variant="filled"
                color="blue"
                fullWidth
            >
                {isLoading ? "Sending..." : "Show Color LEDs"}
            </Button>
        </Group>
    );
};
