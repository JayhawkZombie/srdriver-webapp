import React, { useMemo, useRef, useState } from 'react';
import { useDeviceControllerContext } from '../../controllers/DeviceControllerContext';
import { useActiveDeviceId, useAppStore } from '../../store/appStore';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress, Stack } from '@mui/material';
import { SDCardBLEClient } from './SDCardBLEClient';
import { useSDCardStream } from './useSDCardStream';
import { SDCardTree } from '../SDCardTree';
import type { FileNode } from '../SDCardTree';

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

  // Track the current directory (default: '/')
  const [, setCurrentDir] = useState<string>('/');

  // Track expanded node IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Helper to update children of a node in the file tree (in Zustand)
  const updateNodeChildren = (tree: FileNode, nodeName: string, children: FileNode[]): FileNode => {
    if (tree.name === nodeName) {
      return { ...tree, children };
    }
    if (tree.children) {
      return { ...tree, children: tree.children.map(child => updateNodeChildren(child, nodeName, children)) };
    }
    return tree;
  };

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
    } else if (streamingData && streamingData.name) {
      // streamingData is a FileNode for the directory just listed
      // Update only that node's children in the file tree
      setSDCardLoading(false);
      setSDCardError(null);
      setSDCardFileTree((prevTree: FileNode | null) => {
        if (!prevTree) return streamingData as FileNode;
        return updateNodeChildren(prevTree, (streamingData as FileNode).name, (streamingData as FileNode).children || []);
      });
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
 
  // Send LIST command for a directory
  const listDirectory = (dir: string) => {
    if (!bleClient) {
      setSDCardError('No SD card BLE client available');
      return;
    }
    clearSDCardState();
    setCurrentDir(dir);
    // Only list one directory deep
    sendCommand('LIST', dir);
  };

  // Initial load or refresh
  const onLoadSDCard = () => {
    listDirectory('/');
  };

  // Handle directory expand/collapse
  const handleToggleExpand = (nodeId: string, isExpanding: boolean) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (isExpanding) {
        next.add(nodeId);
        // Find the node in the file tree
        const findNode = (node: FileNode, id: string): FileNode | null => {
          if (node.name === id) return node;
          if (node.children) {
            for (const child of node.children) {
              const found = findNode(child, id);
              if (found) return found;
            }
          }
          return null;
        };
        if (fileTree) {
          const node = findNode(fileTree, nodeId);
          if (node && node.type === 'directory' && (!node.children || node.children.length === 0)) {
            // Only list if children are missing
            sendCommand('LIST', node.name);
          }
        }
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, margin: '0 auto', mt: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          SD Card Browser
        </Typography>
        <Button variant="outlined" size="small" onClick={onLoadSDCard} disabled={state === 'loading'}>
          Refresh
        </Button>
      </Stack>
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
          <SDCardTree 
            fileTree={fileTree} 
            onFileSelect={() => {}} 
            isLoading={false} 
            expandedIds={expandedIds} 
            onToggleExpand={handleToggleExpand}
          />
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