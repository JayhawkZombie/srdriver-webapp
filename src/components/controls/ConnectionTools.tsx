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
import { useDeviceControllerMap } from '../../controllers/DeviceControllerContext';
import { useDeviceMetadata, useDeviceConnection } from '../../store/appStore';

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
  const device: Device | undefined = devices.find(d => d.browserId === deviceId);
  const deviceMetadata = useDeviceMetadata(deviceId);
  const setDeviceNickname = useAppStore((state) => state.setDeviceNickname);
  const deviceConnection = useDeviceConnection(deviceId);
  const { getController } = useDeviceControllerMap();
  if (!deviceId) {
    console.error('ConnectionTools: deviceId is undefined');
    return null;
  }
  const handleDisconnect = () => device && disconnectDevice(device.browserId);
  const handleConnect = () => device && connectDevice(device.browserId);
  // Allow rendering with a null device (for empty row)
  if (!device) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5, justifyContent: "center" }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <EditableNickname
            browserId={deviceId}
            value={deviceMetadata?.nickname || ''}
            fallbackName={''}
            onChange={nickname => {
              if (!deviceId) {
                console.error('setDeviceNickname called with undefined deviceId');
                return;
              }
              setDeviceNickname(deviceId, nickname);
            }}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          <Tooltip title="Connect">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleConnect()}
            >
              <PowerSettingsNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {deviceConnection?.bleRTT !== undefined && (
            <Tooltip title={`BLE RTT: ${deviceConnection.bleRTT} ms (click to re-ping)`}>
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
                  if (!deviceId) {
                    console.error('RTT ping called with undefined deviceId');
                    return;
                  }
                  const controller = getController(deviceId);
                  if (controller) controller.pingForRTT();
                }}
              >
                {deviceConnection.bleRTT} ms
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  }
  return (
      <Box
          sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              gap: 1.5,
              justifyContent: "center",
          }}
      >
          <Box
              sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
              }}
          >
              <EditableNickname
                  browserId={device.browserId}
                  value={deviceMetadata?.nickname}
                  fallbackName={device.name}
                  onChange={(nickname) => {
                    if (!device.browserId) {
                      console.error('setDeviceNickname called with undefined browserId');
                      return;
                    }
                    setDeviceNickname(device.browserId, nickname);
                  }}
                  size="small"
              />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
            {device ? (
              <ConnectionStatusIcon device={device} />
            ) : null}
            {device.isConnected ? (
              <Tooltip title="Disconnect">
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => handleDisconnect()}
                  disabled={device.isConnecting}
                >
                  <LinkOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                title={device.isConnecting ? "Connecting..." : "Connect"}
              >
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleConnect()}
                  disabled={device.isConnecting}
                >
                  <PowerSettingsNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {deviceConnection?.bleRTT !== undefined && (
              <Tooltip
                title={`BLE RTT: ${deviceConnection.bleRTT} ms (click to re-ping)`}
              >
                <IconButton
                  size="small"
                  sx={{
                    ml: 1,
                    p: 0,
                    width: 36,
                    height: 24,
                    minWidth: 36,
                    minHeight: 24,
                    borderRadius: "6px",
                    background: "#222",
                    color: "#fff",
                    opacity: 0.85,
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                    "&:hover": { background: "#333" },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!device.browserId) {
                      console.error('RTT ping called with undefined browserId');
                      return;
                    }
                    const controller = getController(device.browserId);
                    if (controller) controller.pingForRTT();
                  }}
                >
                  {deviceConnection.bleRTT} ms
                </IconButton>
              </Tooltip>
            )}
          </Box>
      </Box>
  );
};

export default ConnectionTools; 