import { useState } from 'react';
import { Button, Stack, Text, Alert } from '@mantine/core';
import { IconBluetooth, IconBluetoothConnected } from '@tabler/icons-react';
import { BLEConnection } from '../services/BLEConnection';
import { SRDriver } from '../services/SRDriver';
import { DeviceControls } from './DeviceControls';

export const ConnectionButton = () => {
  const [bleConnection, setBleConnection] = useState<BLEConnection | null>(null);
  const [srDriver, setSrDriver] = useState<SRDriver | null>(null);
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

      setBleConnection(connection);
      setSrDriver(driver);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (bleConnection) {
        await bleConnection.disconnect();
      }
      setBleConnection(null);
      setSrDriver(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  };

  const isConnected = bleConnection?.isConnected() || false;

  return (
    <Stack gap="md">
      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {!isConnected && (
        <Button
          leftSection={<IconBluetooth size={16} />}
          onClick={handleConnect}
          loading={isConnecting}
          color="blue"
          variant="filled"
        >
          Connect to SRDriver
        </Button>
      )}

      {isConnected && (
        <Text size="sm" c="green" ta="center">
          ✅ Connected to SRDriver device
        </Text>
      )}

      <DeviceControls srDriver={srDriver} onDisconnect={handleDisconnect} />
    </Stack>
  );
};
