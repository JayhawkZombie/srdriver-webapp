import React, { useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, Alert, Stack } from '@mui/material';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';

const PATTERN_COUNT = 18;

const PatternResponsePanel: React.FC = () => {
  const { devices } = useDeviceControllerContext();
  const activeDevice = devices.find(d => d.isConnected);
  const [patternIndex, setPatternIndex] = useState(0);
  const [isFiring, setIsFiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFire = () => {
    setError(null);
    setSuccess(null);
    if (!activeDevice || !activeDevice.controller) {
      setError('No connected device');
      return;
    }
    setIsFiring(true);
    // Fire-and-forget BLE command
    activeDevice.controller.firePattern(patternIndex)
      .then(() => setSuccess(`Fired pattern ${patternIndex}`))
      .catch(e => setError(e.message || 'Failed to fire pattern'))
      .finally(() => setIsFiring(false));
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Pattern Response</Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1 }}>{success}</Alert>}
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="pattern-select-label">Pattern</InputLabel>
          <Select
            labelId="pattern-select-label"
            value={patternIndex}
            label="Pattern"
            onChange={e => setPatternIndex(Number(e.target.value))}
          >
            {Array.from({ length: PATTERN_COUNT }, (_, idx) => (
              <MenuItem key={idx} value={idx}>{`Pattern ${idx}`}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleFire}
          disabled={isFiring}
          sx={{ minWidth: 80 }}
        >
          {isFiring ? 'Firing...' : 'Fire'}
        </Button>
      </Stack>
    </Box>
  );
};

export default PatternResponsePanel; 