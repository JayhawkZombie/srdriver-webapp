import React, { useCallback } from 'react';
import { Paper, Box, Slider, Typography, FormControl, InputLabel, Select, MenuItem, Tooltip } from '@mui/material';
import PulseControlsPanel from './PulseControlsPanel';
import { usePulseTools } from '../controllers/PulseToolsContext';

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

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
      <Box>
        <Box sx={{ fontWeight: 600, fontSize: 18, mb: 1 }}>Pulse Tools</Box>
        <PulseControlsPanel compact />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
          <Box>
            <Tooltip title="Minimum interval between pulses (debounce)">
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Debounce (ms)</Typography>
            </Tooltip>
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
            <Tooltip title="Maximum brightness allowed for a pulse">
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Max Brightness</Typography>
            </Tooltip>
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
            <Tooltip title="Easing factor to prevent huge jumps in brightness">
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Easing</Typography>
            </Tooltip>
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
            <Tooltip title="Trigger a one-time effect on the device">
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Effect</Typography>
            </Tooltip>
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
          (Coming soon: more controls for how pulses are sent)
        </Box>
      </Box>
    </Paper>
  );
};

export default PulseToolsCard; 