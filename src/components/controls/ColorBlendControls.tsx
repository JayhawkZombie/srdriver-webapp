import React, { useState } from "react";
import {
    Stack,
    Text,
    Group,
    Button,
} from "@mantine/core";
import { IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { ColorRange } from "../generic-controls/ColorRange";
import { hexToRgb } from "../utility/ColorUtil";
type Props = {
    srDriver: SRDriver | null;
};

export const ColorBlendControls: React.FC<Props> = ({ srDriver }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [colorRange, setColorRange] = useState<[string, string]>([
        "#00ff00",
        "#ff00ff",
    ]);

    const handleShowColorBlendLEDs = async () => {
        if (!srDriver) return;

        setIsLoading(true);
        try {
            const color1Rgb = hexToRgb(colorRange[0]);
            const color2Rgb = hexToRgb(colorRange[1]);

            if (!color1Rgb || !color2Rgb) {
                console.error("Invalid color format");
                return;
            }

            // Send JSON command to show color blend LEDs with selected colors
            const command = JSON.stringify({
                t: "effect",
                e: {
                    t: "color_blend",
                    p: {
                        c1: `rgb(${color1Rgb.r},${color1Rgb.g},${color1Rgb.b})`,
                        c2: `rgb(${color2Rgb.r},${color2Rgb.g},${color2Rgb.b})`,
                        s: 1.0, // speed
                        d: -1, // duration (infinite)
                    },
                },
            });

            await srDriver.sendCommand(command);
            console.log("✅ Sent color blend LED command:", command);
        } catch (error) {
            console.error("Failed to send color blend LED command:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Group gap="md" w="100%">
            <Text size="sm" c="dimmed">
                🌊 Color Blend Effect - Smooth transition between two colors
            </Text>

            <Stack gap="sm" w="100%">
                <ColorRange format="hex" value={colorRange} onChange={(value) => {
                    setColorRange([
                        value[0] ?? "#000000",
                        value[1] ?? "#000000",
                    ]);
                }} />

                <Button
                    leftSection={<IconPalette size={16} />}
                    onClick={handleShowColorBlendLEDs}
                    loading={isLoading}
                    variant="filled"
                    color="teal"
                    fullWidth
                >
                    {isLoading ? "Sending..." : "Show Color Blend LEDs"}
                </Button>
            </Stack>
        </Group>
    );
};
