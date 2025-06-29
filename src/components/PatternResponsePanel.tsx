import React, { useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, Stack, Snackbar, Alert } from '@mui/material';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { useAppStore } from '../store/appStore';
import type { Device } from '../types/Device';

const PATTERN_COUNT = 18;

const firePattern = (
  patternIndex: number,
  activeDevice: Device | undefined,
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

// Utility to fire a pattern on the currently active device (by id)
export function fireSelectedPattern(patternIndex: number, devices: Device[], activeDeviceId: string | null) {
  const device = devices.find(d => d.id === activeDeviceId && d.isConnected);
  if (device && device.controller) {
    device.controller.firePattern(patternIndex);
  } else {
    console.warn('[fireSelectedPattern] No connected device to fire pattern on.', { patternIndex, activeDeviceId, devices });
  }
}

const PatternResponsePanel: React.FC = () => {
  const { devices } = useDeviceControllerContext();
  const activeDeviceId = useAppStore(state => state.activeDeviceId);
  const setActiveDeviceId = useAppStore(state => state.setActiveDeviceId);
  const connectedDevices = devices.filter(d => d.isConnected);
  // Use activeDeviceId if set, else default to first connected
  const selectedDevice = connectedDevices.find(d => d.id === activeDeviceId) || connectedDevices[0];
  const patternIndex = useAppStore(state => state.patternResponseIndex || 0);
  const setPatternIndex = useAppStore(state => state.setPatternResponseIndex);
  const [isFiring, setIsFiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Show Snackbar when error/success changes
  React.useEffect(() => {
    if (error) {
      setShowError(true);
      setShowSuccess(false);
    } else if (success) {
      setShowSuccess(true);
      setShowError(false);
    }
  }, [error, success]);

  const handleCloseSnackbar = () => {
    setShowError(false);
    setShowSuccess(false);
    setError(null);
    setSuccess(null);
  };

  const handleFire = () => {
    console.log('[PatternResponsePanel] Firing pattern', patternIndex, 'on device', selectedDevice?.id, selectedDevice);
    firePattern(patternIndex, selectedDevice, (msg) => { setSuccess(msg); setShowSuccess(true); }, (msg) => { setError(msg); setShowError(true); }, setIsFiring);
  };

  return (
    <Box sx={{ p: 1, position: 'relative' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Pattern Response</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        {connectedDevices.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="device-select-label">Device</InputLabel>
            <Select
              labelId="device-select-label"
              value={selectedDevice?.id || ''}
              label="Device"
              onChange={e => setActiveDeviceId(e.target.value)}
            >
              {connectedDevices.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.name || d.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
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
      <Snackbar
        open={!!showSuccess && !!success}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {typeof success === 'string' && success.length > 0 && (
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        )}
      </Snackbar>
      <Snackbar
        open={!!showError && !!error}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {typeof error === 'string' && error.length > 0 && (
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default PatternResponsePanel;