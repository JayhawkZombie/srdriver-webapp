import React, { useState, useEffect } from "react";
import {
    Card,
    Stack,
    Text,
    Slider,
    Group,
    Button,
    ColorInput, type ColorInputProps,
    SegmentedControl,
    TextInput,
    PasswordInput,
    Divider,
} from "@mantine/core";
import { IconX, IconPalette } from "@tabler/icons-react";
import styles from "./ColorRange.module.css";

type Props = {
    label?: string;
    format: ColorInputProps["format"];
    value: [ColorInputProps["value"], ColorInputProps["value"]];
    onChange: (value: [ColorInputProps["value"], ColorInputProps["value"]]) => void;
};

export const ColorRange: React.FC<Props> = ({ label, format, value, onChange }) => {
    return (
        <Card withBorder>
            {/* <Group gap="sm" w="100%" wrap="nowrap"> */}
            <Stack gap="sm" w="fit-content">
                {label && <Text size="sm" fw={500}>{label}</Text>}
                <ColorInput
                    size="xs"
                    format={format}
                    value={value[0]}
                    onChange={(newVal: string) => {
                        console.log("newVal", newVal);
                        onChange([newVal, value[1]]);
                    }}
                />
                <div
                    className={styles.rangeDisplay}
                    style={
                        {
                            "--hsv-color-1": value[0],
                            "--hsv-color-2": value[1],
                        } as React.CSSProperties
                    }
                />
                <ColorInput
                    size="xs"
                    format={format}
                    value={value[1]}
                    onChange={(newVal: string) => {
                        onChange([value[0], newVal]);
                    }}
                />
            </Stack>
            {/* </Group> */}
        </Card>
    );
};
