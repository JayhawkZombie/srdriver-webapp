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
    type ColorInputProps,
} from "@mantine/core";
import { IconX, IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { ColorRange } from "../generic-controls/ColorRange";
import styles from "./ColorBlendControls.module.css";
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
            // // Convert hex colors to RGB format
            // const hexToRgb = (hex: string) => {
            //     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
            //         hex
            //     );
            //     return result
            //         ? {
            //               r: parseInt(result[1], 16),
            //               g: parseInt(result[2], 16),
            //               b: parseInt(result[3], 16),
            //           }
            //         : null;
            // };

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
                {/* <Group gap="sm" w="fit-content">
                    <Text size="sm" fw={500} w="50%">
                        Color 1:
                    </Text>
                    <ColorInput
                        className={styles.colorInput}
                        value={blendColor1}
                        onChange={setBlendColor1}
                        placeholder="Pick color 1"
                        // w="50%"
                    />
                </Group>

                <Group gap="sm" w="100%">
                    <Text size="sm" fw={500} w="50%">
                        Color 2:
                    </Text>
                    <ColorInput
                        value={blendColor2}
                        onChange={setBlendColor2}
                        placeholder="Pick color 2"
                        w="50%"
                    />
                </Group> */}

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
