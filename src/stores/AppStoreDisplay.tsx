import { Button, Card, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { useAppStore } from './appStore';
import styles from './AppStoreDisplay.module.css';
import { ConnectionItem } from './ConnectionItem';

export default function AppStoreDisplay() {
  const deviceHistory = useAppStore((state) => state.deviceHistory);
  const clearDeviceHistory = useAppStore((state) => state.clearDeviceHistory);
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder className={styles.appStoreDisplay}>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>Device History ({Object.keys(deviceHistory).length})</Text>
          <Button onClick={() => clearDeviceHistory()}>Clear Device History</Button>
        </Group>
        <ScrollArea h={300}>
          {Object.keys(deviceHistory).length === 0 ? (
            <Text size="sm" c="dimmed" ta="center">
              No device history yet. Connect to a device and start controlling it.
            </Text>
          ) : (
            <div>
                {/* Display from most recent on top to the oldest */}
              {Object.keys(deviceHistory).reverse().map((key) => (
                <ConnectionItem key={key} deviceInfo={deviceHistory[key]} />
              ))}
            </div>
          )}
        </ScrollArea>
      </Stack>
    </Card>
  );
};
