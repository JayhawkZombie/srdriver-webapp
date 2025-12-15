import React from "react";
import { RangeSlider, type RangeSliderValue, Group, Text } from "@mantine/core";
import styles from "./LabeledRangeSlider.module.css";
import isNil from "lodash/isNil";

type Props = {
    label: string;
    value: RangeSliderValue;
    onChange: (value: RangeSliderValue) => void;
    min: number;
    max: number;
    step: number;
    defaultValue?: RangeSliderValue;
    unit?: string;
    minRange?: number;
    customValueFormatter?: (value: RangeSliderValue) => string;
};


export const LabeledRangeSlider: React.FC<Props> = ({ label, value, onChange, min, max, step, defaultValue, unit, minRange, customValueFormatter }) => {
    let valueDisplay = "";
    if (customValueFormatter) {
        valueDisplay = customValueFormatter(value);
    } else {
            const val1 = isNil(value[0]) ? "n/a" : value[0].toFixed(2);
            const val2 = isNil(value[1]) ? "n/a" : value[1].toFixed(2);
            const val1Unit = isNil(unit) ? "" : unit;
            const val2Unit = isNil(unit) ? "" : unit;
        valueDisplay = val1 + " " + val1Unit + " - " + val2 + " " + val2Unit;
    }
    return (
        <Group gap="sm" w="100%">
            <Group className={styles.labelGroup}>
                <Text size="sm" fw={500}>
                    {label}
                </Text>
                <Text size="sm" c="dimmed" className={styles.textValue}>
                    {/* Show text so it always has 2 decimal places */}
                    {valueDisplay}
                </Text>
            </Group>
            <RangeSlider
                min={min}
                max={max}
                minRange={minRange ?? 1}
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