import { Card, Group, Slider, Stack, Text } from '@mantine/core';
import React from 'react';
import { type SliderValue } from '../../generic-controls/LabeledSlider';


// Controls to set hte value of 3 coefficients for the wave pattern

type Props = {
    coefficients: number[];
    onChange: (coeff: number[]) => void;
};

export const CoeffecientsControls: React.FC<Props> = ({ coefficients, onChange }) => {
    const doUpdate = (index: number, newVal: SliderValue) => {
        const newCoeffs = [...coefficients];
        newCoeffs[index] = newVal ?? 0.0;
        onChange(newCoeffs);
    };
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder w="100%">
            <Stack gap="sm" w="100%">
                {coefficients.map((coefficient, index) => (
                    <Group gap="sm" w="100%" key={index} wrap="nowrap">
                        <Slider
                            w="100%"
                            value={coefficient}
                            onChange={(newVal: SliderValue) => {
                                doUpdate(index, newVal ?? 0.0);
                            }}
                            min={0}
                            max={1}
                            step={0.01}
                            defaultValue={0.0}
                        />
                        <Text size="sm" fw={500}>
                            {coefficient.toFixed(2)}
                        </Text>
                    </Group>
                    // <LabeledSlider
                    //     key={index}
                    //     label={`Coefficient ${index + 1}`}
                    //     value={coefficient}
                    //     onChange={(newVal: SliderValue) => {
                    //         doUpdate(index, newVal ?? 0.0);
                    //     }}
                    //     min={0}
                    //     max={1}
                    //     step={0.01}
                    //     defaultValue={0.0}
                    //     unit=""
                    // />
                ))}
            </Stack>
        </Card>
    );
};