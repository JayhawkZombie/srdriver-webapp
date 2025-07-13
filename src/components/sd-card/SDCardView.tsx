import React, { useMemo, useRef, useState } from 'react';
import { useDeviceControllerContext } from '../../controllers/DeviceControllerContext';
import { useActiveDeviceId, useAppStore } from '../../store/appStore';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress, Stack } from '@mui/material';
import { SDCardBLEClient } from './SDCardBLEClient';
import { useSDCardStream } from './useSDCardStream';
import { SDCardFileTree } from './SDCardFileTree';
import type { FileNode } from '../SDCardTree';
import { findNodeByPath, updateNodeChildren, ensureEmptyChildrenForDirs, addPathsToFileTree } from './SDUtils';
import { SDCardContextMenuPortal } from './SDCardContextMenuPortal';
import type { SDCardContextMenuAction } from './SDCardContextMenuAction';

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
    } else if (streamingData && (streamingData as FileNode).name) {
      // streamingData is a FileNode for the directory just listed
      console.log('[SDCardView] Raw streamingData:', streamingData);
      // Ensure all directories have children: [] and correct path
      const normalizedData = ensureEmptyChildrenForDirs(streamingData as FileNode);
      console.log('[SDCardView] After ensureEmptyChildrenForDirs:', normalizedData);
      const dataWithPaths = addPathsToFileTree(normalizedData);
      console.log('[SDCardView] After addPathsToFileTree:', dataWithPaths);
      setSDCardLoading(false);
      setSDCardError(null);
      setSDCardFileTree((prevTree: FileNode | null) => {
        if (!prevTree) {
          console.log('[SDCardView] No previous tree, setting root:', dataWithPaths);
          return dataWithPaths;
        }
        const nodePath = dataWithPaths.path || dataWithPaths.name;
        const updated = updateNodeChildren(prevTree, nodePath, dataWithPaths.children || []);
        console.log('[SDCardView] Updated fileTree after updateNodeChildren:', updated);
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
          const node = findNodeByPath(fileTree, nodeId);
          console.log('[SDCardView] Finding', { id: nodeId, node });
          let isLoadingSpinner = false;
          if (node && node.children && node.children.length === 1) {
            const childNode = node.children[0] as FileNode;
            // FileNode does not have 'id', so check for loading spinner by path
            if (typeof childNode.path === 'string' && childNode.path === nodeId + '__loading') {
              isLoadingSpinner = true;
            }
          }
          if (node && node.type === 'directory' && (!node.children || node.children.length === 0 || isLoadingSpinner)) {
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
  const getContextMenuActions = (path: string, node: FileNode): SDCardContextMenuAction[] => [
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
      actions: getContextMenuActions(path, node),
    });
  };

  // SDCardFileViewer: Streams and displays the contents of a file from the SD card
  const SDCardFileViewer: React.FC<{ bleClient: SDCardBLEClient | null; filePath: string | null }> = ({ bleClient, filePath }) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
      if (!bleClient || !filePath) return;
      setLoading(true);
      setError(null);
      setContent(null);
      bleClient.reset();
      bleClient.setOnComplete((json) => {
        try {
          setContent(json);
          setLoading(false);
        } catch (e) {
          setError('Failed to parse file content');
          setLoading(false);
        }
      });
      bleClient.sendCommand(`PRINT ${filePath}`);
    }, [bleClient, filePath]);

    if (!filePath) return null;
    if (loading) return <Box sx={{ p: 2 }}><CircularProgress size={20} /> Loading file…</Box>;
    if (error) return <Box sx={{ p: 2, color: 'red' }}>{error}</Box>;
    return <Box sx={{ p: 2, whiteSpace: 'pre', fontFamily: 'monospace', background: '#181c20', color: '#fff', borderRadius: 2 }}>{content}</Box>;
  };
  // (You can later add a state to SDCardView to show SDCardFileViewer when a file is selected)

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
          {/* <SDCardTree
            fileTree={fileTree}
            onFileSelect={() => {}} 
            isLoading={false} 
            expandedIds={expandedIds} 
            onToggleExpand={handleToggleExpand}
            loadingDirId={loadingDirId}
          /> */}
          <SDCardFileTree
            fileTree={fileTree}
            expandedIds={expandedIds}
            loadingDirId={loadingDirId}
            onExpand={path => handleToggleExpand(path, true)}
            onCollapse={path => handleToggleExpand(path, false)}
            onFileSelect={() => {}}
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