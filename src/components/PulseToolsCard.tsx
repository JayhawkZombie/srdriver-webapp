import React, { useState, useCallback } from 'react';
import { Paper, Box, Slider, Typography, FormControl, InputLabel, Select, MenuItem, Tooltip } from '@mui/material';
import PulseControlsPanel from './PulseControlsPanel';

const effectOptions = [
  { label: 'None', value: '' },
  { label: 'Flash', value: 'flash' },
  { label: 'Fade', value: 'fade' },
  { label: 'Strobe', value: 'strobe' },
  // Add more as needed
];

const PulseToolsCard: React.FC = () => {
  // Local state for pulse control tools
  const [debounceMs, setDebounceMs] = useState(200);
  const [maxBrightness, setMaxBrightness] = useState(90);
  const [easing, setEasing] = useState(0.3);
  const [effect, setEffect] = useState('');

  // Handlers with useCallback to avoid unnecessary re-renders
  const handleDebounceChange = useCallback((_: any, value: number | number[]) => {
    setDebounceMs(value as number);
  }, []);
  const handleMaxBrightnessChange = useCallback((_: any, value: number | number[]) => {
    setMaxBrightness(value as number);
  }, []);
  const handleEasingChange = useCallback((_: any, value: number | number[]) => {
    setEasing(value as number);
  }, []);
  const handleEffectChange = useCallback((e: any) => {
    setEffect(e.target.value);
  }, []);

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
              value={debounceMs}
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
              value={maxBrightness}
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
              value={easing}
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
                value={effect}
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