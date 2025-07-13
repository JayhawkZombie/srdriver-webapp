import React from 'react';
import { useDeviceControllerContext } from '../../controllers/DeviceControllerContext';
import { useActiveDeviceId, useAppStore } from '../../store/appStore';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import type { AppState } from '../../store/appStore';

const selectSDCardState = (state: AppState) => ({
  fileTree: state.sdCard.fileTree,
  loading: state.sdCard.loading,
  error: state.sdCard.error,
});

export const SDCardView: React.FC = () => {
  const { devices } = useDeviceControllerContext();
  const activeDeviceId = useActiveDeviceId();
  const { fileTree, loading, error } = useAppStore(selectSDCardState);
  const activeDevice = devices.find(d => d.browserId === activeDeviceId);
  const showSDCard = activeDevice && activeDevice.isConnected && activeDevice.controller?.hasSDCard;

  // State detection
  let state: 'noDevice' | 'idle' | 'loading' | 'loaded' | 'error';
  if (!showSDCard) {
    state = 'noDevice';
  } else if (loading) {
    state = 'loading';
  } else if (error) {
    state = 'error';
  } else if (fileTree) {
    state = 'loaded';
  } else {
    state = 'idle';
  }

  // Placeholder for sending LIST command (to be wired up to BLE logic)
  const onLoadSDCard = () => {
    // TODO: Wire up BLE LIST command logic here
    alert('Send LIST command to device (not yet implemented)');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, margin: '0 auto', mt: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        SD Card Browser
      </Typography>
      {state === 'noDevice' && (
        <Typography variant="body1" color="text.secondary">
          No connected devices with SD card support found.
        </Typography>
      )}
      {state === 'idle' && (
        <Button variant="contained" onClick={onLoadSDCard} sx={{ mt: 2 }}>
          Load SD Card
        </Button>
      )}
      {state === 'loading' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={24} />
          <Typography>Loading SD card file tree…</Typography>
        </Box>
      )}
      {state === 'loaded' && fileTree && (
        <Box sx={{ mt: 2 }}>
          {/* Minimal: show file tree as JSON for now */}
          <pre style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, fontSize: 14 }}>
            {JSON.stringify(fileTree, null, 2)}
          </pre>
        </Box>
      )}
      {state === 'error' && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="contained" color="error" onClick={onLoadSDCard}>
            Retry
          </Button>
        </Box>
      )}
    </Box>
  );
}; 