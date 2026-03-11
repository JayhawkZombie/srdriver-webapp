import React from "react";
import { Text, Group, ColorInput, type ColorInputProps, Paper } from "@mantine/core";
import styles from "./ColorRange.module.css";

type Props = {
	label?: string;
	format: ColorInputProps["format"];
	value: [ColorInputProps["value"], ColorInputProps["value"]];
	onChange: (value: [ColorInputProps["value"], ColorInputProps["value"]]) => void;
};

export const ColorRange: React.FC<Props> = ({ label, format, value, onChange }) => {
	return (
		<Paper p="sm" withBorder w="100%">
			<Group gap="sm" w="100%" align="center" justify="flex-start">
				{/* <Stack gap="sm" w="100%" align="center"> */}
				{label && (
					<Text size="sm" fw={500}>
						{label}
					</Text>
				)}
				<Group w="100%">
					<ColorInput
						withEyeDropper={false}
						className={styles.colorInput}
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
						withEyeDropper={false}
						className={styles.colorInput}
						size="xs"
						format={format}
						value={value[1]}
						onChange={(newVal: string) => {
							onChange([value[0], newVal]);
						}}
					/>
				</Group>
				{/* </Stack> */}
				{/* </Group> */}
			</Group>
		</Paper>
	);
};
