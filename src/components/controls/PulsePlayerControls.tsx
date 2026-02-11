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
    type RangeSliderValue,
    Grid,
} from "@mantine/core";
import { IconX, IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { WebSocketConnection } from "./WebSocketConnection";
import { LabeledRangeSlider } from "../generic-controls/LabeledRangeSlider";
import { JSONCommandPreview } from "../generic-controls/JSONCommandPreview";
import { parseHSL } from "../utility/ColorUtil";
import { ColorRange } from "../generic-controls/ColorRange";

type Props = {
    srDriver: SRDriver | null;
};

export const PulsePlayerControls: React.FC<Props> = ({ srDriver }) => {
    const [pulsePlayerColor, setPulsePlayerColor] = useState("#ffffff");
    const [isLoading, setIsLoading] = useState(false);

    const [pulseWidthRange, setPulseWidthRange] = useState<RangeSliderValue>([
        5, 30
    ]);
    const [pulseSpeedRange, setPulseSpeedRange] = useState<RangeSliderValue>([
        5, 30
    ]);
    const [timeBetweenSpawnsRange, setTimeBetweenSpawnsRange] =
        useState<RangeSliderValue>([0.1, 10.0]);
    const [pulseHiColorHueRange, setPulseHiColorHueRange] = useState<[string, string]>([
        "hsl(257, 100%, 50%)",
        "hsl(102, 100%, 50%)",
    ]);

    const generateCommandJson = () => {
        const parsedPulseHiColorHueRange = parseHSL(pulseHiColorHueRange[0]);
        const parsedPulseHiColorHueRange2 = parseHSL(pulseHiColorHueRange[1]);
        if (!parsedPulseHiColorHueRange || !parsedPulseHiColorHueRange2) {
            console.error("Invalid color format");
            return {};
        }
        const pulseHiColorHueMin = parsedPulseHiColorHueRange.h;
        const pulseHiColorHueMax = parsedPulseHiColorHueRange2.h;
        return {
            t: "effect",
            e: {
                t: "pulse",
                p: {
                    pw_min: pulseWidthRange[0],
                    pw_max: pulseWidthRange[1],
                    ps_min: pulseSpeedRange[0],
                    ps_max: pulseSpeedRange[1],
                    tbs_min: timeBetweenSpawnsRange[0],
                    tbs_max: timeBetweenSpawnsRange[1],
                    hi_min: pulseHiColorHueMin,
                    hi_max: pulseHiColorHueMax,
                },
            },
        };
    };

    const handleShowPulsePlayerLEDs = async () => {
        if (!srDriver) return;

        setIsLoading(true);
        try {
            // Send JSON command to show color LEDs (shortened field names)
            const commandJson = generateCommandJson();
            const command = JSON.stringify(commandJson);

            await srDriver.sendCommand(command);
            console.log("✅ Sent pulse player LED command:", command);
        } catch (error) {
            console.error("Failed to send pulse player LED command:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const commandJson = generateCommandJson();

    return (
        <Stack gap="md" w="100%">
            <Text size="sm" fw={500} w={100}>
                Pulse Player
            </Text>
            {/* <Group gap="md" w="100%"> */}
            <Grid>
                <Grid.Col span={8}>
                    <ColorRange
                        format="hsl"
                        label="Pulse Hi Color Hue"
                        value={pulseHiColorHueRange}
                        onChange={(value) => {
                            setPulseHiColorHueRange([
                                value[0] ?? "hsl(257, 100%, 50%)",
                                value[1] ?? "hsl(102, 100%, 50%)",
                            ]);
                        }}
                    />
                </Grid.Col>
                <Grid.Col span={4}>
                    <LabeledRangeSlider
                        label="Pulse Width"
                        value={pulseWidthRange}
                        onChange={(newVal: RangeSliderValue) => {
                            setPulseWidthRange(newVal);
                        }}
                        min={0}
                        max={300}
                        step={1}
                        defaultValue={[1, 10]}
                        unit=""
                    />
                    <LabeledRangeSlider
                        label="Pulse Speed"
                        value={pulseSpeedRange}
                        onChange={(newVal: RangeSliderValue) => {
                            setPulseSpeedRange(newVal);
                        }}
                        min={0}
                        max={300}
                        step={1}
                        defaultValue={[1, 10]}
                        unit=""
                    />
                    <LabeledRangeSlider
                        label="Time Between Spawns"
                        value={timeBetweenSpawnsRange}
                        onChange={(newVal: RangeSliderValue) => {
                            setTimeBetweenSpawnsRange(newVal);
                        }}
                        min={0}
                        max={20}
                        step={0.01}
                        defaultValue={[1, 10]}
                        unit="s"
                    />
                </Grid.Col>
            </Grid>

            <JSONCommandPreview command={commandJson} />
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
        </Stack>
    );
};
