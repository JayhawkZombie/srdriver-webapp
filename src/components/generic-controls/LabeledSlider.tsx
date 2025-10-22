import React from "react";
import { Slider, type SliderProps, Group, Text } from "@mantine/core";
import styles from "./LabeledSlider.module.css";

export type SliderValue = SliderProps["value"];

type Props = {
    label: string;
    value: SliderValue;
    onChange: (value: SliderValue) => void;
    min: number;
    max: number;
    step: number;
    defaultValue: SliderValue;
};

export const LabeledSlider: React.FC<Props> = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    defaultValue,
}) => {
    return (
        <Group gap="sm" w="100%">
            <Text size="sm" fw={500}>
                {label}
            </Text>
            <Text size="sm" c="dimmed" className={styles.textValue}>
                {value ? value.toFixed(2) : "n/a"}
            </Text>
            <Slider
                min={min}
                max={max}
                step={step}
                defaultValue={defaultValue}
                value={value}
                onChange={onChange}
                // labelAlwaysOn
                classNames={styles}
                className={styles.slider}
            />
        </Group>
    );
};
