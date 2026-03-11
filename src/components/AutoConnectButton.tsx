// Button that auto-connects (like ConnectionButton, but provided the IP address ahead of time it will just try to initiate a connection when clicked)
import { ActionIcon } from "@mantine/core";
import { IconPlugConnectedX } from "@tabler/icons-react";
import { useDeviceContext } from "../contexts/DeviceContext";
import { useAppStore } from "../stores/appStore";
type Props = {
	ipAddress: string;
};

export const AutoConnectButton = ({ ipAddress }: Props) => {
	const { connectDeviceWebSocket } = useDeviceContext();
	const addDeviceToHistory = useAppStore((state) => state.addDeviceToHistory);
	const handleConnect = async () => {
		await connectDeviceWebSocket(ipAddress, async (info) => {
			console.log("WANT TO ADD DEVICE TO HISTORY", info);
			const driver = info.srDriver;
			// Use the IP we connected with directly, matching WebSocketConnection pattern
			addDeviceToHistory({
				id: driver.getDeviceId(),
				name: `SRDriver`,
				ipAddress: ipAddress,
				connectionType: "websocket",
				lastConnected: new Date().toISOString(),
			});
		});
	};
	return (
		<ActionIcon onClick={handleConnect}>
			<IconPlugConnectedX />
		</ActionIcon>
	);
};
