import { useState } from "react";
import { ActionIcon, Container, Drawer, Stack } from "@mantine/core";
import AppStoreDisplay from "../stores/AppStoreDisplay";
import { CommunicationMonitor } from "./monitoring/CommunicationMonitor";
import { IconInfoCircle } from "@tabler/icons-react";

export default function AppInfoViews() {
	const [opened, setOpened] = useState(false);

	return (
		<>
			<Drawer opened={opened} onClose={() => setOpened(false)} position="right">
				<Container size="xs" w="100%">
					<Stack>
						{/* <Group justify="space-between"> */}
						<AppStoreDisplay />
						<CommunicationMonitor />
						{/* </Group> */}
					</Stack>
				</Container>
			</Drawer>
			<ActionIcon onClick={() => setOpened(true)}>
				<IconInfoCircle size={18} />
			</ActionIcon>
		</>
	);
}
