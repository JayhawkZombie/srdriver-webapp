import {
    Group,
    Text,
    Button,
    type RangeSliderValue,
    Stack,
    RangeSlider,
    Grid,
    ColorInput,
    HueSlider,
    Card,
} from "@mantine/core";
import React, { useState, useEffect } from "react";
import { IconCloudRain } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { LabeledRangeSlider } from "../generic-controls/LabeledRangeSlider";
import {
    LabeledSlider,
    type SliderValue,
} from "../generic-controls/LabeledSlider";
import { JSONCommandPreview } from "../generic-controls/JSONCommandPreview";
import { ColorRange } from "../generic-controls/ColorRange";
import { parseHSL } from "../utility/ColorUtil";

type Props = {
    srDriver: SRDriver | null;
};

export const RainEffectControls: React.FC<Props> = ({ srDriver }) => {
    const [isLoading, setIsLoading] = useState(false);

    const [baseTimeBetweenRings, setBaseTimeBetweenRings] = useState(0.14);
    const [oddsOfRadiating, setOddsOfRadiating] = useState(3);
    const [ringWidthRange, setRingWidthRange] = useState<RangeSliderValue>([
        2, 4,
    ]);

    const [fadeRRatio, setFadeRRatio] = useState(1.6);
    const [fadeWRatio, setFadeWRatio] = useState(1.6);
    const [baseSpawnTime, setBaseSpawnTime] = useState(0.5);
    const [lifetimeRange, setLifetimeRange] = useState<RangeSliderValue>([
        0.5, 2.0,
    ]);
    const [amplitudeRange, setAmplitudeRange] = useState<RangeSliderValue>([
        0.3, 1.0,
    ]);
    const [speedFactor, setSpeedFactor] = useState(1.0);
    const [spawnColumnRange, setSpawnColumnRange] = useState<RangeSliderValue>([
        -8 + 8,
        38 + 8,
    ]);
    const [spawnRowRange, setSpawnRowRange] = useState<RangeSliderValue>([
        -8 + 8,
        38 + 8,
    ]);
    const [tStartFactor, setTStartFactor] = useState(2.0);
    const [tStartMod, setTStartMod] = useState(1000);


    const [hiLightRangeHSV, setHiLightRangeHSV] = useState<[string, string]>([
        "hsl(257, 100%, 50%)",
        "hsl(102, 100%, 50%)",
    ]);
    const [loLightRangeHSV, setLoLightRangeHSV] = useState<[string, string]>([
        "hsl(16, 100%, 50%)",
        "hsl(80, 100%, 50%)",
    ]);

    const generateCommandJson = () => {

        const parsedHiLightHSL = parseHSL(hiLightRangeHSV[0]);
        const parsedHiLightHSL2 = parseHSL(hiLightRangeHSV[1]);
        const parsedLoLightHSL = parseHSL(loLightRangeHSV[0]);
        const parsedLoLightHSL2 = parseHSL(loLightRangeHSV[1]);
        console.log("parsedHiLightHSL", parsedHiLightHSL, parsedHiLightHSL2);
        console.log("parsedLoLightHSL", parsedLoLightHSL, parsedLoLightHSL2);
        if (!parsedHiLightHSL || !parsedHiLightHSL2 || !parsedLoLightHSL || !parsedLoLightHSL2) {
            console.error("Invalid color format");
            return {};
        }

        return {
            t: "effect",
            e: {
                t: "rain",
                p: {
                    sc_min: spawnColumnRange[0],
                    sc_max: spawnColumnRange[1],
                    sr_min: spawnRowRange[0],
                    sr_max: spawnRowRange[1],
                    hi_min: parsedHiLightHSL.h,
                    hi_max: parsedHiLightHSL2.h,
                    lo_min: parsedLoLightHSL.h,
                    lo_max: parsedLoLightHSL2.h,
                    rw_min: ringWidthRange[0],
                    rw_max: ringWidthRange[1],
                    lt_min: lifetimeRange[0],
                    lt_max: lifetimeRange[1],
                    amp_min: amplitudeRange[0],
                    amp_max: amplitudeRange[1],
                    oor: oddsOfRadiating,
                    sf: speedFactor,
                    st: baseSpawnTime,
                    tsf: tStartFactor,
                    tsm: tStartMod,
                },
            },
        };
    };

    const [onePulseChance, setOnePulseChance] = useState(0.3);

    const handleShowRainLEDs = async () => {
        if (!srDriver) return;

        setIsLoading(true);
        try {
            const command = JSON.stringify(generateCommandJson());

            await srDriver.sendCommand(command);
            console.log("✅ Sent rain LED command:", command);
        } catch (error) {
            console.error("Failed to send rain LED command:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Group gap="md" w="100%" h="100%">
            <Stack gap="md" h="100%" w="100%">
                <Text size="sm" c="dimmed">
                    🌧️ Rain Effect
                </Text>
                <Grid gutter="md">
                    <Grid.Col span={4}>
                        <ColorRange
                            label="Hi Light Range"
                            format="hsl"
                            value={hiLightRangeHSV}
                            onChange={(value) => {
                                setHiLightRangeHSV([
                                    value[0] ?? "hsl(257, 100%, 50%)",
                                    value[1] ?? "hsl(102, 100%, 50%)",
                                ]);
                            }}
                        />
                        <ColorRange
                            label="Lo Light Range"
                            format="hsl"
                            value={loLightRangeHSV}
                            onChange={(value) => {
                                setLoLightRangeHSV([
                                    value[0] ?? "hsl(16, 100%, 50%)",
                                    value[1] ?? "hsl(80, 100%, 50%)",
                                ]);
                            }}
                        />
                        <LabeledRangeSlider
                            label="Ring Width"
                            value={ringWidthRange}
                            onChange={(newVal: RangeSliderValue) => {
                                setRingWidthRange(newVal);
                            }}
                            min={0}
                            max={12}
                            step={0.1}
                            minRange={1}
                            // defaultValue={[2, 4]}
                            unit="px"
                        />
                        <LabeledRangeSlider
                            label="Lifetime Range"
                            value={lifetimeRange}
                            onChange={(newVal: RangeSliderValue) => {
                                setLifetimeRange(newVal);
                            }}
                            min={0}
                            max={10}
                            step={0.01}
                        />
                        <LabeledRangeSlider
                            label="Amplitude Range"
                            value={amplitudeRange}
                            onChange={(newVal: RangeSliderValue) => {
                                setAmplitudeRange(newVal);
                            }}
                            min={0}
                            max={10}
                            step={0.01}
                        />
                    </Grid.Col>
                    {/* Leftmost */}
                    <Grid.Col span={4}>
                        <LabeledSlider
                            label="Fade R Ratio"
                            value={fadeRRatio}
                            onChange={(newVal: SliderValue) => {
                                setFadeRRatio(newVal ?? 1.6);
                            }}
                            min={0}
                            max={5}
                            step={0.01}
                            defaultValue={1.6}
                            unit="px"
                        />
                        <LabeledSlider
                            label="Fade W Ratio"
                            value={fadeWRatio}
                            onChange={(newVal: SliderValue) => {
                                setFadeWRatio(newVal ?? 1.6);
                            }}
                            min={0}
                            max={5}
                            step={0.01}
                            defaultValue={1.6}
                            unit="px"
                        />
                        <LabeledRangeSlider
                            label="Spawn Column Range"
                            value={spawnColumnRange}
                            onChange={(newVal: RangeSliderValue) => {
                                setSpawnColumnRange(newVal);
                            }}
                            min={0}
                            max={32}
                            step={1}
                            defaultValue={[-8, 38]}
                            unit="px"
                            customValueFormatter={(value: RangeSliderValue) => {
                                return `(${value[0]}, ${value[1]})`;
                            }}
                        />
                        <LabeledRangeSlider
                            label="Spawn Row Range"
                            value={spawnRowRange}
                            onChange={(newVal: RangeSliderValue) => {
                                setSpawnRowRange(newVal);
                            }}
                            customValueFormatter={(value: RangeSliderValue) => {
                                return `(${value[0]}, ${value[1]})`;
                            }}
                            min={0}
                            max={32}
                            step={1}
                            defaultValue={[-8, 38]}
                            unit="px"
                        />
                        <LabeledSlider
                            label="Odds Of Radiating"
                            value={oddsOfRadiating}
                            onChange={(newVal: SliderValue) => {
                                setOddsOfRadiating(newVal ?? 3);
                            }}
                            min={0}
                            max={10}
                            step={1}
                            defaultValue={3}
                            unit=""
                            customValueFormatter={(value: SliderValue) => {
                                return `1 in ${value}`;
                            }}
                        />
                        <LabeledSlider
                            label="One Pulse Chance"
                            value={onePulseChance}
                            onChange={(newVal: SliderValue) => {
                                setOnePulseChance(newVal ?? 0.3);
                            }}
                            min={0}
                            max={1}
                            step={0.01}
                            defaultValue={0.3}
                            unit=""
                            customValueFormatter={(value: SliderValue) => {
                                return `${(value ?? 0) * 100}%`;
                            }}
                        />
                    </Grid.Col>
                    {/* Middle */}
                    <Grid.Col span={4}>
                        <LabeledSlider
                            label="Base Time Between Rings"
                            value={baseTimeBetweenRings}
                            onChange={(newVal: SliderValue) => {
                                setBaseTimeBetweenRings(newVal ?? 0.14);
                            }}
                            min={0}
                            max={1}
                            step={0.01}
                            defaultValue={0.14}
                            unit="s"
                        />
                        <LabeledSlider
                            label="Base Spawn Time"
                            value={baseSpawnTime}
                            onChange={(newVal: SliderValue) => {
                                setBaseSpawnTime(newVal ?? 0.5);
                            }}
                            min={0}
                            max={10}
                            step={0.01}
                            defaultValue={0.5}
                            unit="s"
                        />
                        <LabeledSlider
                            label="Speed Factor"
                            value={speedFactor}
                            onChange={(newVal: SliderValue) => {
                                setSpeedFactor(newVal ?? 1.0);
                            }}
                            min={0}
                            max={10}
                            step={0.01}
                            defaultValue={1.0}
                            unit=""
                        />
                        <LabeledSlider
                            label="T Start Factor"
                            value={tStartFactor}
                            onChange={(newVal: SliderValue) => {
                                setTStartFactor(newVal ?? 2.0);
                            }}
                            min={0}
                            max={4}
                            step={0.01}
                            defaultValue={2.0}
                            unit=""
                        />
                        <LabeledSlider
                            label="T Start Mod"
                            value={tStartMod}
                            onChange={(newVal: SliderValue) => {
                                setTStartMod(newVal ?? 1000);
                            }}
                            min={0}
                            max={10000}
                            step={1}
                            defaultValue={1000}
                            unit=""
                        />
                    </Grid.Col>
                </Grid>
                <Button
                    leftSection={<IconCloudRain size={16} />}
                    onClick={handleShowRainLEDs}
                    loading={isLoading}
                    variant="filled"
                    color="violet"
                    fullWidth
                >
                    {isLoading ? "Sending..." : "Show Rain Effect"}
                </Button>
                <JSONCommandPreview isCompact command={generateCommandJson()} />
            </Stack>
        </Group>
    );
};
