import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import {
  Bluetooth as BluetoothIcon
} from '@mui/icons-material';
import { Device } from '../types/Device';
import PulseControlsPanel from './PulseControlsPanel';
import { DeviceConnectionPanel } from '../controllers/DeviceControllerContext';
import DeviceControls from './DeviceControls';
interface DevicePanelProps {
  device: Device;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onUpdate: (update: Partial<Device>) => void;
}

const DevicePanel: React.FC<DevicePanelProps> = ({ device, onConnect, onDisconnect, onUpdate }) => {
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      await onConnect();
    } catch (e: any) {
      setError(e.message || 'Failed to connect');
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await onDisconnect();
    } catch (e: any) {
      setError(e.message || 'Failed to disconnect');
    }
  };

  // UI rendering (simplified for brevity)
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <CardContent>
        <Typography variant="h6">{device.name}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ mt: 2 }}>
          {device.isConnected ? (
            <Button variant="contained" color="secondary" onClick={handleDisconnect} startIcon={<BluetoothIcon />} disabled={device.isConnecting}>
              Disconnect
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleConnect} startIcon={<BluetoothIcon />} disabled={device.isConnecting}>
              {device.isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </Box>
        {!device.isConnected && (
          <Box sx={{ mt: 3 }}>
            <DeviceConnectionPanel />
          </Box>
        )}
        <Box sx={{ mt: 3 }}>
          <PulseControlsPanel />
        </Box>
        {device.isConnected && device.controller && (
          <DeviceControls device={device} onUpdate={onUpdate} />
        )}
      </CardContent>
    </Card>
  );
};

export default DevicePanel; 