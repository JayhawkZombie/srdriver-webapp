import React, { useState } from "react";
import { Text, Group, Button } from "@mantine/core";
import { IconPalette } from "@tabler/icons-react";
import { SRDriver } from "../../services/SRDriver";

type Props = {
	srDriver: SRDriver | null;
};

export const RainbowColorControls: React.FC<Props> = ({ srDriver }) => {
	const [isLoading, setIsLoading] = useState(false);

	const handleShowRainbowLEDs = async () => {
		if (!srDriver) return;

		setIsLoading(true);
		try {
			// Send JSON command to show rainbow LEDs
			const command = JSON.stringify({
				t: "effect",
				e: {
					t: "rainbow",
					p: {
						s: 1.0, // speed
						r: false, // reverse direction
						d: -1, // duration (infinite)
					},
				},
			});

			await srDriver.sendCommand(command);
			console.log("✅ Sent rainbow LED command:", command);
		} catch (error) {
			console.error("Failed to send rainbow LED command:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Group gap="md" w="100%">
			<Text size="sm" c="dimmed">
				🌈 Rainbow Effect - Flowing rainbow animation across all LEDs
			</Text>

			<Button
				leftSection={<IconPalette size={16} />}
				onClick={handleShowRainbowLEDs}
				loading={isLoading}
				variant="filled"
				color="violet"
				fullWidth
			>
				{isLoading ? "Sending..." : "Show Rainbow LEDs"}
			</Button>
		</Group>
	);
};
