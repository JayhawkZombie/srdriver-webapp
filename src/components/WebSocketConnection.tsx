import { useState } from "react";
import { Stack, Text, Group, Button } from "@mantine/core";
import type { SRDriver } from "../services/SRDriver";
import { useAppStore } from "../stores/appStore";

export const WebSocketConnection = ({
	srDriver,
	ipAddress,
}: {
	srDriver?: SRDriver;
	ipAddress: string;
}) => {
	if (!srDriver || !ipAddress) return null;
	const [isWebSocketConnected, setIsWebSocketConnected] = useState(srDriver.isWebSocketConnected());
	const [isWebSocketLoading, setIsWebSocketLoading] = useState(false);
	const { addDeviceToHistory } = useAppStore();

	const handleWebSocketConnect = async () => {
		setIsWebSocketLoading(true);
		try {
			await srDriver.connectWebSocket(ipAddress);
			setIsWebSocketConnected(true);
			console.log("✅ WebSocket connected successfully");
			addDeviceToHistory({
				id: srDriver.getDeviceId(),
				name: `SRDriver`,
				ipAddress: ipAddress,
				connectionType: "websocket",
				lastConnected: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Failed to connect WebSocket:", error);
			setIsWebSocketConnected(false);
		} finally {
			setIsWebSocketLoading(false);
		}
	};

	const handleWebSocketDisconnect = () => {
		srDriver.disconnectWebSocket();
		setIsWebSocketConnected(false);
		console.log("✅ WebSocket disconnected");
	};

	return (
		<Stack gap="sm">
			<Text size="sm" c="dimmed">
				WiFi IP: {ipAddress}
			</Text>
			<Group gap="sm">
				<Button
					size="xs"
					variant={isWebSocketConnected ? "filled" : "outline"}
					color={isWebSocketConnected ? "green" : "blue"}
					loading={isWebSocketLoading}
					onClick={isWebSocketConnected ? handleWebSocketDisconnect : handleWebSocketConnect}
					disabled={isWebSocketLoading}
				>
					{isWebSocketConnected ? "WebSocket Connected" : "Connect WebSocket"}
				</Button>
				{isWebSocketConnected && (
					<Text size="xs" c="green">
						✅ Real-time control active
					</Text>
				)}
			</Group>
		</Stack>
	);
};
