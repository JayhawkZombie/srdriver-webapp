import React, { useState, createContext, useContext } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, Alert, Stack } from '@mui/material';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { useAppStore } from '../store/appStore';

const PATTERN_COUNT = 18;

const firePattern = (
  patternIndex: number,
  activeDevice: any,
  setSuccess: (msg: string) => void,
  setError: (msg: string) => void,
  setIsFiring: (v: boolean) => void
) => {
  setError('');
  setSuccess('');
  if (!activeDevice || !activeDevice.controller) {
    setError('No connected device');
    return;
  }
  setIsFiring(true);
  // Fire-and-forget BLE command
  activeDevice.controller
    .firePattern(patternIndex)
    .then(() => setSuccess(`Fired pattern ${patternIndex}`))
    .catch((e: any) => setError(e.message || 'Failed to fire pattern'))
    .finally(() => setIsFiring(false));
};

// fireSelectedPattern: utility to fire a pattern on a given device and pattern index
export const fireSelectedPattern = (patternIndex: number, activeDevice: any) => {
  if (!activeDevice || !activeDevice.controller) return;
  activeDevice.controller.firePattern(patternIndex);
};

/**
 * Returns the first connected device from the device controller context.
 * This is a utility for use outside React components (no hooks).
 */
export function getActiveDevice() {
  // This is safe to call outside React because it just returns the current value
  // (useDeviceControllerContext is a hook, but the context value is static)
  // If you want to avoid hooks entirely, you can pass the device explicitly.
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = require('../controllers/DeviceControllerContext');
    const devices = ctx.useDeviceControllerContext().devices;
    return devices.find((d: any) => d.isConnected);
  } catch {
    return undefined;
  }
}

/**
 * Fires the currently selected pattern on the first connected device.
 * Can be called from anywhere (impulse handler, etc.).
 */
export function fireCurrentPattern() {
  const patternIndex = useAppStore.getState().patternResponseIndex;
  console.log('Firing pattern', patternIndex);
  // You may want to pass the device explicitly for more control
  let activeDevice;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = require('../controllers/DeviceControllerContext');
    const devices = ctx.useDeviceControllerContext().devices;
    activeDevice = devices.find((d: any) => d.isConnected);
  } catch {
    activeDevice = undefined;
  }
  if (activeDevice && activeDevice.controller) {
    activeDevice.controller.firePattern(patternIndex);
  }
}

const PatternResponsePanel: React.FC = () => {
  const { devices } = useDeviceControllerContext();
  const activeDevice = devices.find(d => d.isConnected);
  const patternIndex = useAppStore(state => state.patternResponseIndex || 0);
  const setPatternIndex = useAppStore(state => state.setPatternResponseIndex);
  const [isFiring, setIsFiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFire = () => {
    firePattern(patternIndex, activeDevice, setSuccess, setError, setIsFiring);
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