import React from "react";
import { Slider, type SliderProps, Group, Text, Paper } from "@mantine/core";
import styles from "./LabeledSlider.module.css";
import isNil from "lodash/isNil";

export type SliderValue = SliderProps["value"];

type Props = {
    label: string;
    value: SliderValue;
    onChange: (value: SliderValue) => void;
    min: number;
    max: number;
    step: number;
    defaultValue: SliderValue;
    unit?: string;
    customValueFormatter?: (value: SliderValue) => string;
};

export const LabeledSlider: React.FC<Props> = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    defaultValue,
    unit,
    customValueFormatter,
}) => {
    let valueDisplay = "";
    if (customValueFormatter) {
        valueDisplay = customValueFormatter(value);
    } else {
        valueDisplay = isNil(value) ? "n/a" : value.toFixed(2) + " " + unit;
    }
    return (
        <Group gap="sm" w="100%">
            <Paper p="sm" withBorder w="100%">
                <Group className={styles.labelGroup}>
                    <Text size="sm" fw={500}>
                        {label}
                    </Text>
                    <Text size="xs" c="dimmed" className={styles.textValue}>
                        {valueDisplay}
                    </Text>
                </Group>
                <Slider
                    size="xs"
                    min={min}
                    max={max}
                    step={step}
                    defaultValue={defaultValue}
                    value={value}
                    onChange={onChange}
                    // labelAlwaysOn
                    classNames={styles}
                    className={styles.slider + " " + styles.compactSlider}
                />
            </Paper>
        </Group>
    );
};
