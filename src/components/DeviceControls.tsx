import React, { useState, useRef } from 'react';
import { Box, Typography, Slider, FormControl, InputLabel, Select, MenuItem, Stack, TextField, Button, Alert, Tooltip, IconButton } from '@mui/material';
import { useDeviceById } from '../controllers/DeviceControllerContext';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';

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
  deviceId: string;
  onUpdate: (update: any) => void;
  compact?: boolean;
}

// Simple debounce implementation
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Reusable labeled slider with optional tooltip
type LabeledSliderProps = {
  label: string;
  tooltip?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (event: React.SyntheticEvent | Event, value: number | number[]) => void;
  size?: 'small' | 'medium';
  sx?: object;
};
function LabeledSlider({
  label,
  tooltip,
  min,
  max,
  step = 1,
  value,
  onChange,
  size = 'medium',
  sx = {},
}: LabeledSliderProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: size === 'small' ? 12 : 16, mb: 0.5 }}>{label}</Typography>
        {tooltip && (
          <Tooltip title={tooltip}>
            <IconButton size={size} sx={{ p: 0 }}>
              <InfoOutlinedIcon fontSize={size === 'small' ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        valueLabelDisplay="auto"
        size={size}
        sx={sx}
      />
    </Box>
  );
}

const DeviceControls: React.FC<DeviceControlsProps> = ({ deviceId, onUpdate, compact = false }) => {
  const device = useDeviceById(deviceId);
  const [pulseDuration, setPulseDuration] = useState(1000);
  const [pulseTargetBrightness, setPulseTargetBrightness] = useState(255);
  const [isPulsing, setIsPulsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firePatternIndex, setFirePatternIndex] = useState(0);
  const [isFiringPattern, setIsFiringPattern] = useState(false);

  const brightnessWriteRef = useRef(
    debounce((controller, brightness) => {
      setTimeout(() => {
        controller.setBrightness(brightness).catch(() => {});
      }, 0);
    }, 100)
  ).current;

  const speedWriteRef = useRef(
    debounce((controller, speed) => {
      setTimeout(() => {
        controller.setSpeed(speed).catch(() => {});
      }, 0);
    }, 100)
  ).current;

  const patternWriteRef = useRef(
    debounce((controller, patternIndex) => {
      setTimeout(() => {
        controller.setPattern(patternIndex).catch(() => {});
      }, 0);
    }, 100)
  ).current;

  const handleBrightnessChange = (event: React.SyntheticEvent | Event, value: number | number[]) => {
    if (!device || !device.controller) return;
    const brightness = value as number;
    onUpdate({ brightness });
    brightnessWriteRef(device.controller, brightness);
  };

  const handleSpeedChange = (event: React.SyntheticEvent | Event, value: number | number[]) => {
    if (!device || !device.controller) return;
    const speed = value as number;
    onUpdate({ speed });
    speedWriteRef(device.controller, speed);
  };

  const handlePatternChange = (event: any) => {
    if (!device || !device.controller) return;
    const patternIndex = event.target.value;
    onUpdate({ patternIndex });
    patternWriteRef(device.controller, patternIndex);
  };

  const handlePulseBrightness = async () => {
    if (!device || !device.controller) return;
    setIsPulsing(true);
    try {
      await device.controller.pulseBrightness(pulseTargetBrightness, pulseDuration);
    } catch (e: any) {
      setError(e.message || 'Failed to pulse brightness');
    } finally {
      setIsPulsing(false);
    }
  };

  const handleFirePattern = async () => {
    if (!device || !device.controller) return;
    setIsFiringPattern(true);
    setError(null);
    try {
      await device.controller.firePattern(firePatternIndex);
    } catch (e: any) {
      setError(e.message || 'Failed to fire pattern');
    } finally {
      setIsFiringPattern(false);
    }
  };

  if (!device || !device.isConnected || !device.controller) return null;

  return (
    <Box sx={{ mt: compact ? 1 : 3, p: compact ? 0 : 1 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {compact ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          alignItems: 'center',
          p: 2,
          background: 'rgba(0,0,0,0.10)',
          borderRadius: 2,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          <Box sx={{ width: '100%', minWidth: 0, p: 0, m: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <LightbulbOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </Box>
            <LabeledSlider
              label=""
              min={0}
              max={255}
              value={device.brightness}
              onChange={handleBrightnessChange}
              size="small"
              sx={{ height: 18, minWidth: 0, maxWidth: '100%', fontSize: 10, p: 0, m: 0 }}
            />
          </Box>
          <Box sx={{ width: '100%', minWidth: 0, p: 0, m: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <SpeedOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </Box>
            <LabeledSlider
              label=""
              min={0}
              max={255}
              value={device.speed}
              onChange={handleSpeedChange}
              size="small"
              sx={{ height: 18, minWidth: 0, maxWidth: '100%', fontSize: 10, p: 0, m: 0 }}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
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
          <Box sx={{ width: '100%' }}>
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
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Fire Pattern</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 60 }}>
                <Select
                  value={firePatternIndex}
                  onChange={e => setFirePatternIndex(Number(e.target.value))}
                  sx={{ fontSize: 12 }}
                >
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(idx => (
                    <MenuItem key={idx} value={idx} sx={{ fontSize: 12 }}>{`Pattern ${idx}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleFirePattern}
                disabled={isFiringPattern}
                size="small"
                sx={{ minWidth: 0, px: 1, fontSize: 12 }}
              >
                {isFiringPattern ? '...' : 'Fire'}
              </Button>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Stack spacing={2} direction="column" alignItems="stretch">
          <Box sx={{ minWidth: 180 }}>
            <LabeledSlider
              label="Brightness"
              min={0}
              max={255}
              value={device.brightness}
              onChange={handleBrightnessChange}
              size="medium"
            />
          </Box>
          <Box sx={{ minWidth: 180 }}>
            <LabeledSlider
              label="Speed"
              min={0}
              max={255}
              value={device.speed}
              onChange={handleSpeedChange}
              size="medium"
            />
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