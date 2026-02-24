import React, { useState } from "react";
import { Text, Group, Button, ColorInput } from "@mantine/core";
import { IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { hexToRgb } from "../utility/ColorUtil";

type Props = {
    srDriver: SRDriver | null;
};

export const RingPlayerEffectControls: React.FC<Props> = ({ srDriver }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [hiLt, setHiLt] = useState("#ffffff");
    const [loLt, setLoLt] = useState("#000000");
    const [fRowC, setFRowC] = useState(16.0);
    const [fColC, setFColC] = useState(16.0);
    const [ringSpeed, setRingSpeed] = useState(1.0);
    const [ringWidth, setRingWidth] = useState(2.0);
    const [fadeRadius, setFadeRadius] = useState(8.0);
    const [fadeWidth, setFadeWidth] = useState(8.0);
    const [Amp, setAmp] = useState(1.0);

    const handleShowRingPlayerEffect = async () => {
        if (!srDriver) return;

        setIsLoading(true);
        try {
            
            const command = JSON.stringify({
                t: "effect",
                e: {
                    t: "ring_player",
                    p: {
                        hiLt: hexToRgb(hiLt),
                        loLt: hexToRgb(loLt),
                        fRowC: fRowC,
                        fColC: fColC,
                        ringSpeed: ringSpeed,
                        ringWidth: ringWidth,
                        fadeRadius: fadeRadius,
                        fadeWidth: fadeWidth,
                        Amp: Amp,
                    },
                },
            });
            console.log("Sending command:", command);

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
                    Hi Light
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

            <Button
                leftSection={<IconPalette size={16} />}
                onClick={handleShowRingPlayerEffect}
                loading={isLoading}
                variant="filled"
                color="blue"
                fullWidth
            >
                {isLoading ? "Sending..." : "Show Ring Player Effect"}
            </Button>
        </Group>
    );
};
