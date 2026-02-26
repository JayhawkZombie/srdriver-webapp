import React, { useState } from "react";
import {
    Stack,
    Text,
    Group,
    Button,
    ColorInput,
} from "@mantine/core";
import { IconCircleDot } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { hexToRgb, formatRGB } from "../utility/ColorUtil";
import { LabeledSlider, type SliderValue } from "../generic-controls/LabeledSlider";
import { JSONCommandPreview } from "../generic-controls/JSONCommandPreview";

type Props = {
    srDriver: SRDriver | null;
};

export const RingPlayerEffectControls: React.FC<Props> = ({ srDriver }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [hiLt, setHiLt] = useState("#d400ff");
    const [loLt, setLoLt] = useState("#000000");
    const [fRowC, setFRowC] = useState<SliderValue>(16.0);
    const [fColC, setFColC] = useState<SliderValue>(16.0);
    const [ringSpeed, setRingSpeed] = useState<SliderValue>(1.3);
    const [ringWidth, setRingWidth] = useState<SliderValue>(0.29);
    const [fadeRadius, setFadeRadius] = useState<SliderValue>(8.0);
    const [fadeWidth, setFadeWidth] = useState<SliderValue>(8.0);
    const [Amp, setAmp] = useState<SliderValue>(0.5);

    const generateCommandJson = () => {
        const hiRgb = hexToRgb(hiLt);
        const loRgb = hexToRgb(loLt);
        if (!hiRgb || !loRgb) return {};
        return {
            t: "effect",
            e: {
                t: "ring_player",
                p: {
                    hiLt: formatRGB(hiRgb.r, hiRgb.g, hiRgb.b),
                    loLt: formatRGB(loRgb.r, loRgb.g, loRgb.b),
                    fRowC: Number(fRowC),
                    fColC: Number(fColC),
                    ringSpeed: Number(ringSpeed),
                    ringWidth: Number(ringWidth),
                    fadeRadius: Number(fadeRadius),
                    fadeWidth: Number(fadeWidth),
                    Amp: Number(Amp),
                },
            },
        };
    };

    const handleShowRingPlayerEffect = async () => {
        if (!srDriver) return;

        setIsLoading(true);
        try {
            const commandJson = generateCommandJson();
            const command = JSON.stringify(commandJson);
            await srDriver.sendCommand(command);
            console.log("✅ Sent ring player effect:", command);
        } catch (error) {
            console.error("Failed to send ring player effect:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const commandJson = generateCommandJson();

    return (
        <Stack gap="md" w="100%">
            <Text size="sm" fw={500}>
                Ring Player
            </Text>

            <Group gap="md" w="100%">
                <Text size="sm" fw={500} w={90}>
                    Highlight
                </Text>
                <ColorInput
                    value={hiLt}
                    onChange={setHiLt}
                    format="hex"
                    style={{ flex: 1 }}
                    size="md"
                    placeholder="Pick color"
                />
            </Group>
            <Group gap="md" w="100%">
                <Text size="sm" fw={500} w={90}>
                    Low
                </Text>
                <ColorInput
                    value={loLt}
                    onChange={setLoLt}
                    format="hex"
                    style={{ flex: 1 }}
                    size="md"
                    placeholder="Pick color"
                />
            </Group>

            <LabeledSlider
                label="Focus Row Center"
                value={fRowC}
                onChange={(v: SliderValue) => setFRowC(v ?? 16)}
                min={0}
                max={32}
                step={0.5}
                defaultValue={16}
                unit=""
            />
            <LabeledSlider
                label="Focus Col Center"
                value={fColC}
                onChange={(v: SliderValue) => setFColC(v ?? 16)}
                min={0}
                max={32}
                step={0.5}
                defaultValue={16}
                unit=""
            />
            <LabeledSlider
                label="Ring Speed"
                value={ringSpeed}
                onChange={(v: SliderValue) => setRingSpeed(v ?? 1.3)}
                min={0.1}
                max={20}
                step={0.01}
                defaultValue={1.3}
                unit=""
            />
            <LabeledSlider
                label="Ring Width"
                value={ringWidth}
                onChange={(v: SliderValue) => setRingWidth(v ?? 0.29)}
                min={0.01}
                max={3}
                step={0.01}
                defaultValue={0.29}
                unit=""
            />
            <LabeledSlider
                label="Fade Radius"
                value={fadeRadius}
                onChange={(v: SliderValue) => setFadeRadius(v ?? 8)}
                min={0}
                max={20}
                step={0.5}
                defaultValue={8}
                unit=""
            />
            <LabeledSlider
                label="Fade Width"
                value={fadeWidth}
                onChange={(v: SliderValue) => setFadeWidth(v ?? 8)}
                min={0}
                max={20}
                step={0.5}
                defaultValue={8}
                unit=""
            />
            <LabeledSlider
                label="Amp"
                value={Amp}
                onChange={(v: SliderValue) => setAmp(v ?? 0.5)}
                min={0}
                max={1}
                step={0.05}
                defaultValue={0.5}
                unit=""
            />

            <JSONCommandPreview command={commandJson} />
            <Button
                leftSection={<IconCircleDot size={16} />}
                onClick={handleShowRingPlayerEffect}
                loading={isLoading}
                variant="filled"
                color="blue"
                fullWidth
            >
                {isLoading ? "Sending..." : "Show Ring Player Effect"}
            </Button>
        </Stack>
    );
};
