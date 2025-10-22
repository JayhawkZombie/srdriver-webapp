import React from "react";
import { RangeSlider, type RangeSliderValue, Group, Text } from "@mantine/core";
import styles from "./LabeledRangeSlider.module.css";

type Props = {
    label: string;
    value: RangeSliderValue;
    onChange: (value: RangeSliderValue) => void;
    min: number;
    max: number;
    step: number;
    defaultValue: RangeSliderValue;
};


export const LabeledRangeSlider: React.FC<Props> = ({ label, value, onChange, min, max, step, defaultValue }) => {


    return (
        <Group gap="sm" w="100%">
            <Text size="sm" fw={500}>
                {label}
            </Text>
            <Text size="sm" c="dimmed" className={styles.textValue}>
                {/* Show text so it always has 2 decimal places */}
                {(value[0] / 1000).toFixed(2)} s - {(value[1] / 1000).toFixed(2)} s
            </Text>
            <RangeSlider
                min={min}
                max={max}
                step={step}
                defaultValue={defaultValue}
                value={value}
                onChange={onChange}
                // labelAlwaysOn
                classNames={styles}
                className={styles.rangeSlider}
            />
        </Group>
    );
};