import React, { useMemo, useRef, useState } from 'react';
import { useDeviceControllerContext } from '../../controllers/DeviceControllerContext';
import { useActiveDeviceId, useAppStore } from '../../store/appStore';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress, Stack } from '@mui/material';
import { SDCardBLEClient } from './SDCardBLEClient';
import { useSDCardStream } from './useSDCardStream';
import { SDCardFileTree } from './SDCardFileTree';
import type { FileNode } from '../SDCardTree';
import { findNodeByPath, ensureEmptyChildrenForDirs, addPathsToFileTree, compactJsonToFileNode, updateFileTreeWithListResponse } from './SDUtils';
import { SDCardContextMenuPortal } from './SDCardContextMenuPortal';
import type { SDCardContextMenuAction } from './SDCardContextMenuAction';
import { SDCardFileViewer } from './SDCardFileViewer';

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
  // Track which directory is currently loading
  const [loadingDirId, setLoadingDirId] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

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
      setLoadingDirId(null);
    } else if (streamingData && (streamingData as Record<string, unknown>).c === 'LIST') {
      // streamingData is a compact LIST response
      const fileNode = compactJsonToFileNode(streamingData as Record<string, unknown>);
      const normalizedData = ensureEmptyChildrenForDirs(fileNode);
      const dataWithPaths = addPathsToFileTree(normalizedData);
      console.log('[SDCardView] LIST response:', { fileNode, normalizedData, dataWithPaths });
      setSDCardLoading(false);
      setSDCardError(null);
      setSDCardFileTree((prevTree: FileNode | null) => {
        console.log('[SDCardView] Calling updateFileTreeWithListResponse with:', { prevTree, dataWithPaths });
        const updated = updateFileTreeWithListResponse(prevTree, dataWithPaths);
        console.log('[SDCardView] File tree after updateFileTreeWithListResponse:', updated);
        return updated;
      });
      setLoadingDirId(null);
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
    console.log('[SDCardView] handleToggleExpand:', { nodeId, isExpanding });
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (isExpanding) {
        next.add(nodeId);
        // Use findNodeByPath from SDUtils
        if (fileTree) {
          let isLoadingSpinner = false;
          const foundNode = findNodeByPath(fileTree, nodeId);
          if (foundNode && foundNode.children && foundNode.children.length === 1) {
            const childNode = foundNode.children[0] as FileNode;
            if (typeof childNode.path === 'string' && childNode.path === nodeId + '__loading') {
              isLoadingSpinner = true;
            }
          }
          if (foundNode && foundNode.type === 'directory' && (!foundNode.children || foundNode.children.length === 0 || isLoadingSpinner)) {
            console.log('[SDCardView] Sending LIST command for:', nodeId);
            setLoadingDirId(nodeId);
            sendCommand('LIST', nodeId);
          }
        }
      } else {
        next.delete(nodeId);
      }
      return next;
    });
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
    node: FileNode;
    actions: SDCardContextMenuAction[];
  } | null>(null);

  // Context menu actions (customize as needed)
  const getContextMenuActions = (path: string): SDCardContextMenuAction[] => [
    { label: 'Open', onClick: () => alert(`Open ${path}`) },
    { label: 'Delete', onClick: () => alert(`Delete ${path}`), intent: 'danger' },
  ];

  const handleContextMenu = (path: string, node: FileNode, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      node,
      actions: getContextMenuActions(path),
    });
  };

  // Update file select handler to set selectedFilePath
  const handleFileSelect = (path: string) => {
    setSelectedFilePath(path);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, margin: '0 auto', mt: 2, position: 'relative' }}>
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
        <Box sx={{ mt: 2, position: 'relative' }}>
          <SDCardFileTree
            fileTree={fileTree}
            expandedIds={expandedIds}
            loadingDirId={loadingDirId}
            onExpand={path => handleToggleExpand(path, true)}
            onCollapse={path => handleToggleExpand(path, false)}
            onFileSelect={handleFileSelect}
            onContextMenu={handleContextMenu}
          />
          {contextMenu && (
            <SDCardContextMenuPortal
              x={contextMenu.x}
              y={contextMenu.y}
              actions={contextMenu.actions}
              onClose={() => setContextMenu(null)}
            />
          )}
          {/* File viewer below the tree */}
          {selectedFilePath && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>File Preview: {selectedFilePath}</Typography>
              <SDCardFileViewer bleClient={bleClient} filePath={selectedFilePath} />
            </Box>
          )}
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