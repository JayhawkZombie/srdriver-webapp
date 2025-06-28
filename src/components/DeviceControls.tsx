import React, { useState } from 'react';
import { Box, Typography, Slider, FormControl, InputLabel, Select, MenuItem, Stack, TextField, Button, Alert } from '@mui/material';
import { useSingleDevice } from '../controllers/DeviceControllerContext';

const patternNames = [
  'Pattern 0',
  'Pattern 1',
  'Pattern 2',
  'Pattern 3',
  'Pattern 4',
  'Pattern 5',
  'Pattern 6',
  'Pattern 7',
  'Pattern 8',
];

interface DeviceControlsProps {
  onUpdate: (update: any) => void;
  compact?: boolean;
}

const DeviceControls: React.FC<DeviceControlsProps> = ({ onUpdate, compact = false }) => {
  const device = useSingleDevice();
  const [pulseDuration, setPulseDuration] = useState(1000);
  const [pulseTargetBrightness, setPulseTargetBrightness] = useState(255);
  const [isPulsing, setIsPulsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!device.isConnected || !device.controller) return null;

  return (
    <Box sx={{ mt: compact ? 1 : 3, p: compact ? 0 : 1 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {compact ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          alignItems: 'center',
        }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Brightness</Typography>
            <Slider min={0} max={255} value={device.brightness} valueLabelDisplay="auto" onChange={handleBrightnessChange} size="small" sx={{ height: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Speed</Typography>
            <Slider min={0} max={255} value={device.speed} valueLabelDisplay="auto" onChange={handleSpeedChange} size="small" sx={{ height: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Pattern</Typography>
            <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
              <InputLabel id="pattern-select-label" sx={{ fontSize: 12 }}>Pattern</InputLabel>
              <Select labelId="pattern-select-label" onChange={handlePatternChange} value={device.patternIndex} label="Pattern" sx={{ fontSize: 12 }}>
                {patternNames.map((name, idx) => (
                  <MenuItem key={idx} value={idx} sx={{ fontSize: 12 }}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Pulse</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TextField
                label="Target"
                type="number"
                size="small"
                value={pulseTargetBrightness}
                onChange={e => setPulseTargetBrightness(Number(e.target.value))}
                inputProps={{ min: 0, max: 255, style: { fontSize: 12, width: 40 } }}
                sx={{ width: 60 }}
              />
              <TextField
                label="ms"
                type="number"
                size="small"
                value={pulseDuration}
                onChange={e => setPulseDuration(Number(e.target.value))}
                inputProps={{ min: 10, max: 10000, style: { fontSize: 12, width: 40 } }}
                sx={{ width: 60 }}
              />
              <Button variant="contained" onClick={handlePulseBrightness} disabled={isPulsing} size="small" sx={{ minWidth: 0, px: 1, fontSize: 12 }}>
                {isPulsing ? '...' : 'Go'}
              </Button>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Stack spacing={2} direction="column" alignItems="stretch">
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="subtitle2" sx={{ fontSize: 16 }}>Brightness</Typography>
            <Slider min={0} max={255} value={device.brightness} valueLabelDisplay="auto" onChange={handleBrightnessChange} size="medium" />
          </Box>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="subtitle2" sx={{ fontSize: 16 }}>Speed</Typography>
            <Slider min={0} max={255} value={device.speed} valueLabelDisplay="auto" onChange={handleSpeedChange} size="medium" />
          </Box>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="subtitle2" sx={{ fontSize: 16 }}>Pattern</Typography>
            <FormControl fullWidth size="medium" sx={{ mt: 0.5 }}>
              <InputLabel id="pattern-select-label">Pattern</InputLabel>
              <Select labelId="pattern-select-label" onChange={handlePatternChange} value={device.patternIndex} label="Pattern">
                {patternNames.map((name, idx) => (
                  <MenuItem key={idx} value={idx}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="subtitle2" sx={{ fontSize: 16 }}>Pulse Brightness</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Target"
                type="number"
                size="small"
                value={pulseTargetBrightness}
                onChange={e => setPulseTargetBrightness(Number(e.target.value))}
                inputProps={{ min: 0, max: 255 }}
                sx={{ width: 70 }}
              />
              <TextField
                label="Duration"
                type="number"
                size="small"
                value={pulseDuration}
                onChange={e => setPulseDuration(Number(e.target.value))}
                inputProps={{ min: 10, max: 10000 }}
                sx={{ width: 90 }}
              />
              <Button variant="contained" onClick={handlePulseBrightness} disabled={isPulsing} size="medium">
                {isPulsing ? 'Pulsing...' : 'Pulse'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default DeviceControls; 