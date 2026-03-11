import { Card, Text, Group } from "@mantine/core";
import { AutoConnectButton } from "../components/AutoConnectButton";
import type { PersistedDeviceInfo } from "../types/App";
import { IconBluetooth, IconWifi } from "@tabler/icons-react";
import styles from "./ConnectionItem.module.css";

const WiFiConnectionInfo = ({ ipAddress }: { ipAddress: string }) => {
	return (
		<Group gap="xs">
			<IconWifi size={16} />
			<Text size="sm" c="dimmed">
				{ipAddress}
			</Text>
			<AutoConnectButton ipAddress={ipAddress} />
		</Group>
	);
};

const BLEConnectionInfo = ({ deviceId }: { deviceId: string }) => {
	return (
		<Group gap="xs">
			<IconBluetooth size={16} />
			<Text size="sm" c="dimmed">
				{deviceId}
			</Text>
		</Group>
	);
};

export const ConnectionItem = ({ deviceInfo }: { deviceInfo: PersistedDeviceInfo }) => {
	return (
		<Card className={styles.connectionItem} shadow="sm" padding="lg" radius="md" withBorder>
			{/* <Stack gap="xs"> */}
			<Group gap="xs">
				<Text fw={500} size="sm">
					{deviceInfo.name}
				</Text>
				{deviceInfo.connectionType === "websocket" && deviceInfo.ipAddress && (
					<WiFiConnectionInfo ipAddress={deviceInfo.ipAddress} />
				)}
				{deviceInfo.connectionType === "ble" && <BLEConnectionInfo deviceId={deviceInfo.id} />}
				<Text size="sm" c="dimmed">
					{deviceInfo.lastConnected}
				</Text>
			</Group>
			{/* </Stack> */}
		</Card>
	);
};
