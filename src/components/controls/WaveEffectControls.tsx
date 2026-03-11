import React, { useState } from "react";
import { SRDriver } from "../../services/SRDriver";
import { Button, Card, Text, Stack, ColorInput, Checkbox, Group } from "@mantine/core";
import { IconWaveSine } from "@tabler/icons-react";
import { LabeledSlider, type SliderValue } from "../generic-controls/LabeledSlider";
import { CoeffecientsControls } from "./WaveControls/CoeffecientsControls";
import { JSONCommandPreview } from "../generic-controls/JSONCommandPreview";

type Props = {
	srDriver: SRDriver | null;
};

// Convert hex colors to RGB format
const hexToRgb = (hex: string) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
};

export const WaveEffectControls: React.FC<Props> = ({ srDriver }) => {
	/*
                // Send JSON command to show color blend LEDs with selected colors
            const command = JSON.stringify({
                t: "effect",
                e: {
                    t: "color_blend",
                    p: {
                        c1: `rgb(${color1Rgb.r},${color1Rgb.g},${color1Rgb.b})`,
                        c2: `rgb(${color2Rgb.r},${color2Rgb.g},${color2Rgb.b})`,
                        s: 1.0, // speed
                        d: -1, // duration (infinite)
                    },
                },
            });
    */
	const [isLoading, setIsLoading] = useState(false);

	const [ampRt, setAmpRt] = useState(0.735);
	const [wvLenLt, setWvLenLt] = useState(41.273);
	const [wvLenRt, setWvLenRt] = useState(14.629);
	const [wvSpdLt, setWvSpdLt] = useState(35.004);
	const [wvSpdRt, setWvSpdRt] = useState(13.584);
	const [c_rt, setC_rt] = useState([1.0, 0.0, 3.478]);
	const [c_lt, setC_lt] = useState([0.0, 0.0, 0.0]);
	const [onLight, setOnLight] = useState("#ffffff");
	const [offLight, setOffLight] = useState("#0000ff");
	// const [rightTrigFuncIndex, setRightTrigFuncIndex] = useState(0);
	// const [leftTrigFuncIndex, setLeftTrigFuncIndex] = useState(0);
	const [useRightCoefficients, setUseRightCoefficients] = useState(false);
	const [useLeftCoefficients, setUseLeftCoefficients] = useState(false);
	// const [nTermsRt, setNTermsRt] = useState(0);
	// const [nTermsLt, setNTermsLt] = useState(0);
	const [speed, setSpeed] = useState(1.0);

	const generateCommandJson = () => {
		const onLightRgb = hexToRgb(onLight);
		const offLightRgb = hexToRgb(offLight);
		if (!onLightRgb || !offLightRgb) {
			console.error("Invalid color format");
			return;
		}
		const onLightString = `rgb(${onLightRgb.r},${onLightRgb.g},${onLightRgb.b})`;
		const offLightString = `rgb(${offLightRgb.r},${offLightRgb.g},${offLightRgb.b})`;

		const numTermsRight = useRightCoefficients ? c_rt.length : 0;
		const numTermsLeft = useLeftCoefficients ? c_lt.length : 0;

		return {
			t: "effect",
			e: {
				t: "wave",
				p: {
					rows: 32,
					cols: 32,
					ampRt: ampRt,
					wvLenLt: wvLenLt,
					wvLenRt: wvLenRt,
					wvSpdLt: wvSpdLt,
					wvSpdRt: wvSpdRt,
					c_rt: c_rt,
					c_lt: c_lt,
					onLight: onLightString,
					offLight: offLightString,
					// rtfi: rightTrigFuncIndex,
					// ltfi: leftTrigFuncIndex,
					urc: useRightCoefficients,
					ulc: useLeftCoefficients,
					nTermsRt: numTermsRight,
					nTermsLt: numTermsLeft,
					speed: speed,
				},
			},
		};
	};

	const handleShowWaveLEDs = async () => {
		if (!srDriver) return;
		setIsLoading(true);
		try {
			const command = generateCommandJson();
			if (!command) return;
			await srDriver.sendCommand(JSON.stringify(command));
			console.log("✅ Sent wave LED command:", command);
		} catch (error) {
			console.error("Failed to send wave LED command:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card shadow="sm" padding="lg" radius="md" withBorder>
			<Text size="sm" fw={500}>
				Wave Effect Controls
			</Text>
			<Stack gap="sm" w="100%">
				<ColorInput value={onLight} onChange={setOnLight} placeholder="Pick on light color" />
				<ColorInput value={offLight} onChange={setOffLight} placeholder="Pick off light color" />
				<LabeledSlider
					label="Speed"
					value={speed}
					onChange={(newVal: SliderValue) => {
						setSpeed(newVal ?? 1.0);
					}}
					min={0}
					max={10}
					step={0.01}
					defaultValue={1.0}
					unit="x"
				/>
				<LabeledSlider
					label="Amplitude"
					value={ampRt}
					onChange={(newVal: SliderValue) => {
						setAmpRt(newVal ?? 0.735);
					}}
					min={0}
					max={1}
					step={0.01}
					defaultValue={0.735}
					unit=""
				/>
				<LabeledSlider
					label="Wave Length Right"
					value={wvLenRt}
					onChange={(newVal: SliderValue) => {
						setWvLenRt(newVal ?? 14.629);
					}}
					min={0}
					max={100}
					step={0.01}
					defaultValue={14.629}
					unit="px"
				/>
				<LabeledSlider
					label="Wave Length Left"
					value={wvLenLt}
					onChange={(newVal: SliderValue) => {
						setWvLenLt(newVal ?? 41.273);
					}}
					min={0}
					max={100}
					step={0.01}
					defaultValue={41.273}
					unit="px"
				/>
				<LabeledSlider
					label="Wave Speed Right"
					value={wvSpdRt}
					onChange={(newVal: SliderValue) => {
						setWvSpdRt(newVal ?? 13.584);
					}}
					min={0}
					max={100}
					step={0.01}
					defaultValue={13.584}
					unit="px"
				/>
				<LabeledSlider
					label="Wave Speed Left"
					value={wvSpdLt}
					onChange={(newVal: SliderValue) => {
						setWvSpdLt(newVal ?? 35.004);
					}}
					min={0}
					max={100}
					step={0.01}
					defaultValue={35.004}
					unit="px"
				/>
				<Group gap="sm" w="100%">
					<Stack gap="sm" w="fit-content">
						<Checkbox
							label="Use Right Coefficients"
							checked={useRightCoefficients}
							onChange={(event) => {
								setUseRightCoefficients(event.currentTarget.checked);
							}}
						/>
						<CoeffecientsControls coefficients={c_rt} onChange={setC_rt} />
					</Stack>
					<Stack gap="sm" w="fit-content">
						<Checkbox
							label="Use Left Coefficients"
							checked={useLeftCoefficients}
							onChange={(event) => {
								setUseLeftCoefficients(event.currentTarget.checked);
							}}
						/>
						<CoeffecientsControls coefficients={c_lt} onChange={setC_lt} />
					</Stack>
				</Group>
			</Stack>

			<Button
				leftSection={<IconWaveSine size={16} />}
				onClick={() => {
					handleShowWaveLEDs();
				}}
			>
				{isLoading ? "Sending..." : "Show Wave LEDs"}
			</Button>
			<JSONCommandPreview isCompact command={generateCommandJson() ?? {}} />
		</Card>
	);
};
