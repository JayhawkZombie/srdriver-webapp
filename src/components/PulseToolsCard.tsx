import React, { useCallback } from 'react';
import { Paper, Box, Slider, Typography, FormControl, InputLabel, Select, MenuItem, Tooltip, IconButton } from '@mui/material';
import PulseControlsPanel from './PulseControlsPanel';
import { usePulseTools } from '../controllers/PulseToolsContext';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { useToastContext } from '../controllers/ToastContext';
import { emitPulse } from './useImpulseHandler';
import { usePulseControls } from '../controllers/PulseControlsContext';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useActiveDevice } from './AudioChunkerDemo';

const effectOptions = [
  { label: 'None', value: '' },
  { label: 'Flash', value: 'flash' },
  { label: 'Fade', value: 'fade' },
  { label: 'Strobe', value: 'strobe' },
  // Add more as needed
];

const PulseToolsCard: React.FC = () => {
  const {
    values,
    setDebounceMs,
    setMaxBrightness,
    setEasing,
    setEffect,
  } = usePulseTools();
  const { devices } = useDeviceControllerContext();
  const { showToast } = useToastContext();
  const { activeDeviceId } = useActiveDevice();
  const activeDevice = devices.find(d => d.id === activeDeviceId);
  const { width } = usePulseControls();

  // Handlers with useCallback to avoid unnecessary re-renders
  const handleDebounceChange = useCallback((_: any, value: number | number[]) => {
    if (values.current.debounceMs !== value) setDebounceMs(value as number);
  }, [setDebounceMs, values]);
  const handleMaxBrightnessChange = useCallback((_: any, value: number | number[]) => {
    if (values.current.maxBrightness !== value) setMaxBrightness(value as number);
  }, [setMaxBrightness, values]);
  const handleEasingChange = useCallback((_: any, value: number | number[]) => {
    if (values.current.easing !== value) setEasing(value as number);
  }, [setEasing, values]);
  const handleEffectChange = useCallback((e: any) => {
    if (values.current.effect !== e.target.value) setEffect(e.target.value);
  }, [setEffect, values]);

  const handleGo = () => {
    if (!activeDevice) {
      showToast('No connected device to pulse');
      return;
    }
    emitPulse({
      strength: 1,
      min: 0,
      max: 1,
      tools: values.current,
      device: activeDevice,
      showToast,
      durationMs: width,
    });
  };

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
      <Box>
        <Box sx={{ fontWeight: 600, fontSize: 18, mb: 1 }}>Pulse Tools</Box>
        <PulseControlsPanel compact />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Debounce</Typography>
              <Tooltip title="Noise filter: ignores rapid, repeated triggers within this window.">
                <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Slider
              min={10}
              max={1000}
              step={1}
              value={values.current.debounceMs}
              onChange={handleDebounceChange}
              valueLabelDisplay="auto"
              size="small"
              sx={{ height: 24 }}
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Max</Typography>
              <Tooltip title="Maximum brightness allowed for a pulse.">
                <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Slider
              min={31}
              max={255}
              step={1}
              value={values.current.maxBrightness}
              onChange={handleMaxBrightnessChange}
              valueLabelDisplay="auto"
              size="small"
              sx={{ height: 24 }}
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Easing</Typography>
              <Tooltip title="Smooths out sudden changes in pulse brightness.">
                <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={values.current.easing}
              onChange={handleEasingChange}
              valueLabelDisplay="auto"
              size="small"
              sx={{ height: 24 }}
            />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Effect</Typography>
              <Tooltip title="Visual effect applied to each pulse.">
                <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel id="effect-select-label" sx={{ fontSize: 12 }}>Effect</InputLabel>
              <Select
                labelId="effect-select-label"
                value={values.current.effect}
                label="Effect"
                onChange={handleEffectChange}
                sx={{ fontSize: 12 }}
              >
                {effectOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 12 }}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <button onClick={handleGo} style={{ padding: '6px 16px', fontSize: 14, borderRadius: 4, border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer' }}>
              Go
            </button>
            <span style={{ color: '#888', fontSize: 13 }}>(Send a test pulse to the active device)</span>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default PulseToolsCard; 