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
import PulseControlsPanel from './PulseControlsPanel';
import { DeviceConnectionPanel } from '../controllers/DeviceControllerContext';
import DeviceControls from './DeviceControls';
import EditableNickname from './EditableNickname';
import { useAppStore } from '../store/appStore';
import { useSingleDevice } from '../controllers/DeviceControllerContext';

interface DevicePanelProps {
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onUpdate: (id: string, update: any) => void;
}

const DevicePanel: React.FC<DevicePanelProps> = ({ onConnect, onDisconnect, onUpdate }) => {
  const device = useSingleDevice();
  const [error, setError] = useState<string | null>(null);
  const devicesMetadata = useAppStore(state => state.devicesMetadata);
  const setDeviceNickname = useAppStore(state => state.setDeviceNickname);

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
        <Box sx={{ mb: 1 }}>
          <EditableNickname
            macOrId={device.macOrId}
            value={devicesMetadata[device.macOrId]?.nickname}
            fallbackName={device.name}
            onChange={nickname => setDeviceNickname(device.macOrId, nickname)}
            size="medium"
          />
        </Box>
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
          <DeviceControls deviceId={device.id} onUpdate={update => onUpdate(device.id, update)} />
        )}
      </CardContent>
    </Card>
  );
};

export default DevicePanel; 