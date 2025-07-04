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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { Device } from '../../types/Device';
import { useDeviceControllerMap } from '../../controllers/DeviceControllerContext';

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
  const device: Device | undefined = devices.find(d => d.id === deviceId);
  const deviceMetadata = useAppStore(state => state.deviceMetadata);
  const setDeviceNickname = useAppStore((state: any) => state.setDeviceNickname);
  const deviceConnection = useAppStore(state => state.deviceConnection);
  const { getController } = useDeviceControllerMap();
  console.log("Device connection", deviceConnection);
  // Allow rendering with a null device (for empty row)
  if (!device) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5, justifyContent: "center" }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <EditableNickname
            macOrId={deviceId}
            value={deviceMetadata[deviceId]?.nickname || ''}
            fallbackName={''}
            onChange={nickname => setDeviceNickname(deviceId, nickname)}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          <Tooltip title="Connect">
            <IconButton
              size="small"
              color="primary"
              onClick={e => {
                e.stopPropagation();
                connectDevice(deviceId);
              }}
            >
              <PowerSettingsNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {deviceConnection[deviceId]?.bleRTT !== undefined && (
            <Tooltip title={`BLE RTT: ${deviceConnection[deviceId].bleRTT} ms (click to re-ping)`}>
              <IconButton
                size="small"
                sx={{
                  ml: 1,
                  p: 0,
                  width: 60,
                  height: 24,
                  minWidth: 36,
                  minHeight: 24,
                  borderRadius: '6px',
                  background: '#222',
                  color: '#fff',
                  opacity: 0.85,
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  '&:hover': { background: '#333' },
                }}
                onClick={e => {
                  e.stopPropagation();
                  const controller = getController(deviceId);
                  if (controller) controller.pingForRTT();
                }}
              >
                {deviceConnection[deviceId].bleRTT} ms
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5, justifyContent: "center" }}>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        <EditableNickname
          macOrId={device.macOrId}
          value={deviceMetadata[device.macOrId]?.nickname}
          fallbackName={device.name}
          onChange={nickname => setDeviceNickname(device.macOrId, nickname)}
          size="small"
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
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
        {deviceConnection[device.id]?.bleRTT !== undefined && (
          <Tooltip title={`BLE RTT: ${deviceConnection[device.id].bleRTT} ms (click to re-ping)`}>
            <IconButton
              size="small"
              sx={{
                ml: 1,
                p: 0,
                width: 36,
                height: 24,
                minWidth: 36,
                minHeight: 24,
                borderRadius: '6px',
                background: '#222',
                color: '#fff',
                opacity: 0.85,
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                '&:hover': { background: '#333' },
              }}
              onClick={e => {
                e.stopPropagation();
                const controller = getController(device.id);
                if (controller) controller.pingForRTT();
              }}
            >
              {deviceConnection[device.id].bleRTT} ms
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default ConnectionTools; 