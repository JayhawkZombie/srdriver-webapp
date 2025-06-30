import React from 'react';
import { Tooltip, IconButton, Box } from '@mui/material';
import { useAppStore } from '../../store/appStore';
import { useDeviceControllerContext } from '../../controllers/DeviceControllerContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EditableNickname from '../EditableNickname';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import type { Device } from '../../types/Device';

// ConnectionStatusIcon: shows connection state as an icon (not a chip)
const ConnectionStatusIcon: React.FC<{ device: Device }> = ({ device }) => {
  if (device.isConnected) {
    return (
      <Tooltip title="Connected">
        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
      </Tooltip>
    );
  }
  if (device.isConnecting) {
    return (
      <Tooltip title="Connecting">
        <HourglassEmptyIcon sx={{ color: 'warning.main', fontSize: 20 }} />
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Disconnected">
      <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
    </Tooltip>
  );
};

// Main ConnectionTools component
const ConnectionTools: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const { devices, connectDevice, disconnectDevice } = useDeviceControllerContext();
  const device = devices.find(d => d.id === deviceId);
  const devicesMetadata = useAppStore(state => state.devicesMetadata);
  const setDeviceNickname = useAppStore(state => state.setDeviceNickname);
  if (!device) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5, justifyContent: "center" }}>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        <EditableNickname
          macOrId={device.macOrId}
          value={devicesMetadata[device.macOrId]?.nickname}
          fallbackName={device.name}
          onChange={nickname => setDeviceNickname(device.macOrId, nickname)}
          size="small"
        />
      </Box>
      <ConnectionStatusIcon device={device} />
      {device.isConnected ? (
        <Tooltip title="Disconnect">
          <IconButton
            size="small"
            color="secondary"
            onClick={e => {
              e.stopPropagation();
              disconnectDevice(device.id);
            }}
            disabled={device.isConnecting}
          >
            <LinkOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={device.isConnecting ? 'Connecting...' : 'Connect'}>
          <IconButton
            size="small"
            color="primary"
            onClick={e => {
              e.stopPropagation();
              connectDevice(device.id);
            }}
            disabled={device.isConnecting}
          >
            <PowerSettingsNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ConnectionTools; 