import React, { useState } from "react";
import { Stack, Text, Group, Button, type RangeSliderValue } from "@mantine/core";
import { IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";
import { LabeledRangeSlider } from "../generic-controls/LabeledRangeSlider";
import { LabeledSlider, type SliderValue } from "../generic-controls/LabeledSlider";
import { JSONCommandPreview } from "../generic-controls/JSONCommandPreview";

type Props = {
	srDriver: SRDriver | null;
};

type Params = {
	minDuration: number;
	maxDuration: number;
	minSpawnTime: number;
	maxSpawnTime: number;
	starChance: number;
	maxStarBrightness: number;
	fadeInSpeed: number;
	fadeOutSpeed: number;
};

export const TwinkleEffectControls: React.FC<Props> = ({ srDriver }) => {
	const [effectParams, setEffectParams] = useState<Params>({
		minDuration: 0.5,
		maxDuration: 5.6,
		minSpawnTime: 0.5,
		maxSpawnTime: 5.6,
		starChance: 0.4,
		maxStarBrightness: 100,
		fadeInSpeed: 4,
		fadeOutSpeed: 2,
	});

	const updateMinMaxDurationFloat = (newMinDuration: number, newMaxDuration: number) => {
		const newEffectParams = { ...effectParams };
		console.log("Updating minMaxDurationFloat:", newMinDuration, newMaxDuration);
		newEffectParams.minDuration = newMinDuration;
		newEffectParams.maxDuration = newMaxDuration;
		setEffectParams(newEffectParams);
	};

	const updateMinMaxSpawnTimeFloat = (newMinSpawnTime: number, newMaxSpawnTime: number) => {
		const newEffectParams = { ...effectParams };
		console.log("Updating minSpawnTimeFloat:", newMinSpawnTime, newMaxSpawnTime);
		newEffectParams.minSpawnTime = newMinSpawnTime;
		newEffectParams.maxSpawnTime = newMaxSpawnTime;
		setEffectParams(newEffectParams);
	};

	const updateStarChance = (newStarChance: number) => {
		const newEffectParams = { ...effectParams };
		console.log("Updating starChance:", newStarChance);
		newEffectParams.starChance = newStarChance;
		setEffectParams(newEffectParams);
	};

	const updateMaxStarBrightness = (newMaxStarBrightness: number) => {
		const newEffectParams = { ...effectParams };
		console.log("Updating maxStarBrightness:", newMaxStarBrightness);
		newEffectParams.maxStarBrightness = newMaxStarBrightness;
		setEffectParams(newEffectParams);
	};

	const updateFadeInSpeed = (newFadeInSpeed: number) => {
		const newEffectParams = { ...effectParams };
		console.log("Updating fadeInSpeed:", newFadeInSpeed);
		newEffectParams.fadeInSpeed = newFadeInSpeed;
		setEffectParams(newEffectParams);
	};

	const updateFadeOutSpeed = (newFadeOutSpeed: number) => {
		const newEffectParams = { ...effectParams };
		console.log("Updating fadeOutSpeed:", newFadeOutSpeed);
		newEffectParams.fadeOutSpeed = newFadeOutSpeed;
		setEffectParams(newEffectParams);
	};

	const [isLoading, setIsLoading] = useState(false);

	const handleTwinkleLEDs = async () => {
		if (!srDriver) return;

		setIsLoading(true);
		try {
			/*
                float _minDuration;         // Minimum time between star appearances
    float _maxDuration;         // Maximum time between star appearances
    float _minSpawnTime;        // Minimum time between spawns (for timer-based)
    float _maxSpawnTime;        // Maximum time between spawns (for timer-based)
    float _starChance;          // Probability of new star appearing (0.0 to 1.0)
    float _maxStarBrightness;   // Maximum brightness of stars (0.0 to 1.0)
    float _fadeInSpeed;         // How fast stars fade in (brightness per second)
    float _fadeOutSpeed;        // How fast stars fade out (brightness per second)
    */
			// Send JSON command to show twinkling LEDs with selected parameters
			// Console log them for now
			console.log("Twinkling parameters:", effectParams);
			const command = JSON.stringify({
				t: "effect",
				e: {
					t: "twinkle",
					p: {
						mnd: effectParams.minDuration,
						mxd: effectParams.maxDuration,
						mns: effectParams.minSpawnTime,
						mxs: effectParams.maxSpawnTime,
						sc: effectParams.starChance,
						mb: effectParams.maxStarBrightness,
						fis: effectParams.fadeInSpeed,
						fos: effectParams.fadeOutSpeed,
					},
				},
			});

			await srDriver.sendCommand(command);
			console.log("✅ Sent twinkling LED command:", command);
		} catch (error) {
			console.error("Failed to send twinkling LED command:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const [minMaxDurationMilliseconds, setMinMaxDurationMilliseconds] = useState<RangeSliderValue>([
		effectParams.minDuration * 1000,
		effectParams.maxDuration * 1000,
	]);
	const [minMaxSpawnTimeMilliseconds, setMinMaxSpawnTimeMilliseconds] = useState<RangeSliderValue>([
		effectParams.minSpawnTime * 1000,
		effectParams.maxSpawnTime * 1000,
	]);
	const [starChance, setStarChance] = useState<SliderValue>(effectParams.starChance);
	const [maxStarBrightness, setMaxStarBrightness] = useState<SliderValue>(
		effectParams.maxStarBrightness
	);
	const [fadeInSpeed, setFadeInSpeed] = useState<SliderValue>(effectParams.fadeInSpeed);
	const [fadeOutSpeed, setFadeOutSpeed] = useState<SliderValue>(effectParams.fadeOutSpeed);

	return (
		<Group gap="md" w="100%">
			<Text size="sm" c="dimmed">
				Twinkling Stars Effect
			</Text>
			<Stack gap="sm" w="100%">
				<LabeledRangeSlider
					label="Time Between Stars (s)"
					value={minMaxDurationMilliseconds}
					onChange={(newVal: RangeSliderValue) => {
						setMinMaxDurationMilliseconds(newVal);
						updateMinMaxDurationFloat(newVal[0] / 1000, newVal[1] / 1000);
					}}
					min={0}
					max={10000}
					step={100}
					defaultValue={[500, 5000]}
				/>

				<LabeledRangeSlider
					label="Time Between Spawns (s)"
					value={minMaxSpawnTimeMilliseconds}
					onChange={(newVal: RangeSliderValue) => {
						setMinMaxSpawnTimeMilliseconds(newVal);
						updateMinMaxSpawnTimeFloat(newVal[0] / 1000, newVal[1] / 1000);
					}}
					min={0}
					max={10000}
					step={100}
					defaultValue={[500, 5000]}
				/>
				<LabeledSlider
					label="Star Chance"
					value={starChance}
					onChange={(newVal: SliderValue) => {
						setStarChance(newVal);
						updateStarChance(newVal ?? 0);
					}}
					min={0}
					max={1}
					step={0.01}
					defaultValue={0.4}
				/>
				<LabeledSlider
					label="Max Star Brightness"
					value={maxStarBrightness}
					onChange={(newVal: SliderValue) => {
						setMaxStarBrightness(newVal);
						updateMaxStarBrightness(newVal ?? 0);
					}}
					min={0}
					max={1}
					step={0.01}
					defaultValue={1}
				/>
				<LabeledSlider
					label="Fade In Speed"
					value={fadeInSpeed}
					onChange={(newVal: SliderValue) => {
						setFadeInSpeed(newVal);
						updateFadeInSpeed(newVal ?? 0);
					}}
					min={0}
					max={3}
					step={0.01}
					defaultValue={4}
				/>
				<LabeledSlider
					label="Fade Out Speed"
					value={fadeOutSpeed}
					onChange={(newVal: SliderValue) => {
						setFadeOutSpeed(newVal);
						updateFadeOutSpeed(newVal ?? 0);
					}}
					min={0}
					max={3}
					step={0.01}
					defaultValue={2}
				/>
				<Button
					leftSection={<IconPalette size={16} />}
					onClick={handleTwinkleLEDs}
					loading={isLoading}
					variant="filled"
					color="teal"
					fullWidth
				>
					{isLoading ? "Sending..." : "Show Twinkling LEDs"}
				</Button>
				<JSONCommandPreview
					command={{
						t: "effect",
						e: {
							t: "twinkle",
							p: {
								mnd: effectParams.minDuration,
								mxd: effectParams.maxDuration,
								mns: effectParams.minSpawnTime,
								mxs: effectParams.maxSpawnTime,
								sc: effectParams.starChance,
								mb: effectParams.maxStarBrightness,
								fis: effectParams.fadeInSpeed,
								fos: effectParams.fadeOutSpeed,
							},
						},
					}}
				/>
			</Stack>
		</Group>
	);
};
