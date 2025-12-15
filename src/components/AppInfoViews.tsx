import React from "react";
import { Group, Stack } from "@mantine/core";
import AppStoreDisplay from "../stores/AppStoreDisplay";
import { CommunicationMonitor } from "./monitoring/CommunicationMonitor";

export default function AppInfoViews() {
    return (
        <Stack>
            {/* <Group justify="space-between"> */}
                <AppStoreDisplay />
                <CommunicationMonitor />
            {/* </Group> */}
        </Stack>
    );
}
