import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  TextField
} from '@mui/material';
import {
  Bluetooth as BluetoothIcon
} from '@mui/icons-material';
import { Device } from '../types/Device';

// Utility functions for color conversion
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Pattern names for the 9 available patterns
const patternNames = [
  'Pattern 0',
  'Pattern 1', 
  'Pattern 2',
  'Pattern 3',
  'Pattern 4',
  'Pattern 5',
  'Pattern 6',
  'Pattern 7',
  'Pattern 8'
];

interface DevicePanelProps {
  device: Device;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onUpdate: (update: Partial<Device>) => void;
}

const DevicePanel: React.FC<DevicePanelProps> = ({ device, onConnect, onDisconnect, onUpdate }) => {
  const [pulseDuration, setPulseDuration] = useState(1000);
  const [pulseTargetBrightness, setPulseTargetBrightness] = useState(255);
  const [isPulsing, setIsPulsing] = useState(false);
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

  const handleBrightnessChange = async (_: Event, value: number | number[]) => {
    if (!device.controller) return;
    const brightness = value as number;
    try {
      await device.controller.setBrightness(brightness);
      onUpdate({ brightness });
    } catch (e: any) {
      setError(e.message || 'Failed to set brightness');
    }
  };

  const handleSpeedChange = async (_: Event, value: number | number[]) => {
    if (!device.controller) return;
    const speed = value as number;
    try {
      await device.controller.setSpeed(speed);
      onUpdate({ speed });
    } catch (e: any) {
      setError(e.message || 'Failed to set speed');
    }
  };

  const handlePatternChange = async (event: any) => {
    if (!device.controller) return;
    const patternIndex = event.target.value;
    try {
      await device.controller.setPattern(patternIndex);
      onUpdate({ patternIndex });
    } catch (e: any) {
      setError(e.message || 'Failed to set pattern');
    }
  };

  const handlePulseBrightness = async () => {
    if (!device.controller) return;
    setIsPulsing(true);
    try {
      await device.controller.pulseBrightness(pulseTargetBrightness, pulseDuration);
    } catch (e: any) {
      setError(e.message || 'Failed to pulse brightness');
    } finally {
      setIsPulsing(false);
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
        {device.isConnected && device.controller && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">Brightness</Typography>
            <Slider min={0} max={255} value={device.brightness} valueLabelDisplay="auto" onChange={handleBrightnessChange} />
            <Typography variant="subtitle1">Speed</Typography>
            <Slider min={0} max={255} value={device.speed} valueLabelDisplay="auto" onChange={handleSpeedChange} />
            <Typography variant="subtitle1">Pattern</Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="pattern-select-label">Pattern</InputLabel>
              <Select labelId="pattern-select-label" onChange={handlePatternChange} value={device.patternIndex}>
                {patternNames.map((name, idx) => (
                  <MenuItem key={idx} value={idx}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Pulse Brightness</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Target Brightness"
                type="number"
                size="small"
                value={pulseTargetBrightness}
                onChange={e => setPulseTargetBrightness(Number(e.target.value))}
                inputProps={{ min: 0, max: 255 }}
              />
              <TextField
                label="Duration (ms)"
                type="number"
                size="small"
                value={pulseDuration}
                onChange={e => setPulseDuration(Number(e.target.value))}
                inputProps={{ min: 10, max: 10000 }}
              />
              <Button variant="contained" onClick={handlePulseBrightness} disabled={isPulsing}>
                {isPulsing ? 'Pulsing...' : 'Pulse'}
              </Button>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DevicePanel; 