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
import DeviceConnectionPanel from './DeviceConnectionPanel';
import DeviceControls from './DeviceControls';
import EditableNickname from './EditableNickname';
import { useAppStore } from '../store/appStore';
import { useSingleDevice, useHeartbeatStatus } from '../controllers/DeviceControllerContext';
import AnimatedStatusChip from './AnimatedStatusChip';

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
  const heartbeat = useHeartbeatStatus(device.id);
  const prevPulse = React.useRef<number | null>(null);

  React.useEffect(() => {
    console.log('DevicePanel effect running', heartbeat?.pulse, prevPulse.current, device.id);
    if (heartbeat?.pulse && heartbeat.pulse !== prevPulse.current) {
      console.log('Heartbeat!', device.id);
    }
    prevPulse.current = heartbeat?.pulse ?? null;
  }, [heartbeat?.pulse, device.id]);

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
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditableNickname
            macOrId={device.macOrId}
            value={devicesMetadata[device.macOrId]?.nickname}
            fallbackName={device.name}
            onChange={nickname => setDeviceNickname(device.macOrId, nickname)}
            size="medium"
          />
          <AnimatedStatusChip
            label={device.isConnected ? 'Connected' : device.isConnecting ? 'Connecting...' : 'Disconnected'}
            color={device.isConnected ? 'success' : device.isConnecting ? 'warning' : 'default'}
            isActive={!!heartbeat?.isAlive}
            pulse={heartbeat?.pulse != null}
            icon={<BluetoothIcon fontSize="small" color={heartbeat?.isAlive ? 'error' : 'disabled'} />}
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