import React from 'react';
import { useDeviceControllerContext } from '../../controllers/DeviceControllerContext';
import { useActiveDeviceId } from '../../store/appStore';
import { Box, Typography } from '@mui/material';
import type { FileNode } from '../../components/SDCardTree';

export type SDCardViewProps = {
  fileTree: FileNode | null;
  loading?: boolean;
  error?: string;
  onFileSelect?: (file: string) => void;
};

export const SDCardView: React.FC = () => {
  const { devices } = useDeviceControllerContext();
  const activeDeviceId = useActiveDeviceId();
  // Find the active device by browserId
  const activeDevice = devices.find(d => d.browserId === activeDeviceId);
  // Only show if the active device is connected and has SD card support
  const showSDCard = activeDevice && activeDevice.isConnected && activeDevice.controller?.hasSDCard;

  return (
    <Box sx={{ width: '100%', maxWidth: 900, margin: '0 auto', mt: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        SD Card Browser
      </Typography>
      {!showSDCard ? (
        <Typography variant="body1" color="text.secondary">
          No connected devices with SD card support found.
        </Typography>
      ) : (
        <>
          {/* SD card browser for active device goes here */}
          {/* TODO: Render SD card file tree and viewer for activeDevice */}
        </>
      )}
    </Box>
  );
}; 