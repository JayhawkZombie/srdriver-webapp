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
import { useDeviceControllerMap } from '../../controllers/DeviceControllerMap';

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
          {/* Show BLE RTT if available */}
          {deviceConnection[deviceId]?.bleRTT !== undefined && device?.isConnected && (
            <Tooltip title={`BLE RTT: ${deviceConnection[deviceId].bleRTT} ms (click to re-ping)`}>
              <IconButton
                size="small"
                sx={{ ml: 0.5, p: 0.5, color: '#444', opacity: 0.7 }}
                onClick={e => {
                  e.stopPropagation();
                  const controller = getController(deviceId);
                  if (controller) controller.pingForRTT();
                }}
              >
                <AccessTimeIcon fontSize="inherit" style={{ fontSize: 14 }} />
                <span style={{ fontSize: 11, marginLeft: 2 }}>{deviceConnection[deviceId].bleRTT} ms</span>
              </IconButton>
            </Tooltip>
          )}
        </Box>
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
        {/* Show BLE RTT if available */}
        {deviceConnection[device.id]?.bleRTT !== undefined && device?.isConnected && (
          <Tooltip title={`BLE RTT: ${deviceConnection[device.id].bleRTT} ms (click to re-ping)`}>
            <IconButton
              size="small"
              sx={{ ml: 0.5, p: 0.5, color: '#444', opacity: 0.7 }}
              onClick={e => {
                e.stopPropagation();
                const controller = getController(device.id);
                if (controller) controller.pingForRTT();
              }}
            >
              <AccessTimeIcon fontSize="inherit" style={{ fontSize: 14 }} />
              <span style={{ fontSize: 11, marginLeft: 2 }}>{deviceConnection[device.id].bleRTT} ms</span>
            </IconButton>
          </Tooltip>
        )}
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