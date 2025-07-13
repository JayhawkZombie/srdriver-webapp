import React, { useMemo, useRef } from 'react';
import { useDeviceControllerContext } from '../../controllers/DeviceControllerContext';
import { useActiveDeviceId, useAppStore } from '../../store/appStore';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { useSDCardStream } from './useSDCardStream';
import { SDCardBLEClient } from './SDCardBLEClient';
import type { FileNode } from '../SDCardTree';

// Individual selectors for Zustand state/actions
const useSDCardFileTree = () => useAppStore(state => state.sdCard.fileTree);
const useSDCardLoading = () => useAppStore(state => state.sdCard.loading);
const useSDCardError = () => useAppStore(state => state.sdCard.error);
const useSetSDCardFileTree = () => useAppStore(state => state.setSDCardFileTree);
const useSetSDCardLoading = () => useAppStore(state => state.setSDCardLoading);
const useSetSDCardError = () => useAppStore(state => state.setSDCardError);
const useClearSDCardState = () => useAppStore(state => state.clearSDCardState);

export const SDCardView: React.FC = () => {
  const { devices } = useDeviceControllerContext();
  const activeDeviceId = useActiveDeviceId();
  const fileTree = useSDCardFileTree();
  const loading = useSDCardLoading();
  const error = useSDCardError();
  const setSDCardFileTree = useSetSDCardFileTree();
  const setSDCardLoading = useSetSDCardLoading();
  const setSDCardError = useSetSDCardError();
  const clearSDCardState = useClearSDCardState();
  const activeDevice = devices.find(d => d.browserId === activeDeviceId);
  const showSDCard = activeDevice && activeDevice.isConnected && activeDevice.controller?.hasSDCard;

  // Manage SDCardBLEClient instances per device
  const clientRefs = useRef<Map<string, SDCardBLEClient>>(new Map());
  
  // Get or create client for active device
  const bleClient = useMemo(() => {
    if (!activeDevice?.controller) return null;
    
    const deviceId = activeDevice.browserId;
    if (!clientRefs.current.has(deviceId)) {
      try {
        const client = new SDCardBLEClient(activeDevice.controller);
        clientRefs.current.set(deviceId, client);
      } catch (err) {
        console.error('Failed to create SD card BLE client:', err);
        return null;
      }
    }
    return clientRefs.current.get(deviceId) || null;
  }, [activeDevice]);

  // Use the streaming hook
  const { loading: streamingLoading, error: streamingError, data: streamingData, progress, sendCommand } = useSDCardStream(bleClient);

  // Sync streaming state with Zustand state
  React.useEffect(() => {
    if (streamingLoading) {
      setSDCardLoading(true);
      setSDCardError(null);
    } else if (streamingError) {
      setSDCardLoading(false);
      setSDCardError(streamingError);
    } else if (streamingData) {
      setSDCardLoading(false);
      setSDCardError(null);
      setSDCardFileTree(streamingData as FileNode);
    }
  }, [streamingLoading, streamingError, streamingData, setSDCardLoading, setSDCardError, setSDCardFileTree]);

  // State detection
  let state: 'noDevice' | 'idle' | 'loading' | 'loaded' | 'error';
  if (!showSDCard) {
    state = 'noDevice';
  } else if (loading || streamingLoading) {
    state = 'loading';
  } else if (error || streamingError) {
    state = 'error';
  } else if (fileTree) {
    state = 'loaded';
  } else {
    state = 'idle';
  }
 
  // Send LIST command via BLE
  const onLoadSDCard = () => {
    if (!bleClient) {
      setSDCardError('No SD card BLE client available');
      return;
    }
    clearSDCardState();
    sendCommand('LIST');
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
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={24} />
            <Typography>Loading SD card file tree…</Typography>
          </Box>
          {progress.total && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Receiving chunks: {progress.received}/{progress.total}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(progress.received / progress.total) * 100} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
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
          <Alert severity="error" sx={{ mb: 2 }}>{error || streamingError}</Alert>
          <Button variant="contained" color="error" onClick={onLoadSDCard}>
            Retry
          </Button>
        </Box>
      )}
    </Box>
  );
}; 