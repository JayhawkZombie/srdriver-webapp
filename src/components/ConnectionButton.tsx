import { useState } from 'react';
import { Button, Stack, Text, Alert, Group, Title } from '@mantine/core';
import { IconBluetooth, IconPlus } from '@tabler/icons-react';
import { BLEConnection } from '../services/BLEConnection';
import { SRDriver } from '../services/SRDriver';
import { DeviceControls } from './DeviceControls';

interface ConnectedDevice {
  id: string;
  name: string;
  bleConnection: BLEConnection;
  srDriver: SRDriver;
}

export const ConnectionButton = () => {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const connection = new BLEConnection();
      await connection.connect();
      
      const driver = new SRDriver(connection);
      await driver.initialize();

      // Create a unique device entry
      const deviceId = `device-${Date.now()}`;
      const deviceName = `SRDriver ${devices.length + 1}`;
      
      const newDevice: ConnectedDevice = {
        id: deviceId,
        name: deviceName,
        bleConnection: connection,
        srDriver: driver
      };

      setDevices(prev => [...prev, newDevice]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        await device.bleConnection.disconnect();
        setDevices(prev => prev.filter(d => d.id !== deviceId));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  };

  return (
    <Stack gap="md">
      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      <Group justify="space-between" align="center">
        <Title order={3}>Connected Devices ({devices.length})</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleConnect}
          loading={isConnecting}
          color="blue"
          variant="filled"
          size="sm"
        >
          Add Device
        </Button>
      </Group>

      {devices.length === 0 && (
        <Text size="sm" c="dimmed" ta="center">
          No devices connected. Click "Add Device" to connect to an SRDriver.
        </Text>
      )}

      {devices.map((device) => (
        <DeviceControls
          key={device.id}
          srDriver={device.srDriver}
          deviceName={device.name}
          onDisconnect={() => handleDisconnect(device.id)}
        />
      ))}
    </Stack>
  );
};
