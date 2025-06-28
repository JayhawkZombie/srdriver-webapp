import React from 'react';
import { Paper, Typography, Box, Button, IconButton, Stack, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import DeviceControls from './DeviceControls';

interface Device {
  id: string;
  name: string;
  isConnected: boolean;
  isConnecting: boolean;
}

interface LightsConnectionCardProps {
  connectedDevices: Device[];
  activeDeviceId: string | null;
  setActiveDeviceId: (id: string) => void;
}

const LightsConnectionCard: React.FC<LightsConnectionCardProps> = ({ activeDeviceId, setActiveDeviceId }) => {
  const { devices, addDevice, connectDevice, disconnectDevice, updateDevice } = useDeviceControllerContext();
  const activeDevice = devices.find(d => d.id === activeDeviceId);

  // Helper for status icon
  const getStatusIcon = (device: Device) => {
    if (device.isConnected) return <Tooltip title="Connected"><CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} /></Tooltip>;
    if (device.isConnecting) return <Tooltip title="Connecting"><HourglassEmptyIcon sx={{ color: 'warning.main', fontSize: 20 }} /></Tooltip>;
    return <Tooltip title="Disconnected"><RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></Tooltip>;
  };

  return (
    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative' }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, width: '100%', textAlign: 'center' }}>
        Visualizer → Lights Connection
      </Typography>
      {devices.length === 0 ? (
        <Button variant="contained" fullWidth onClick={addDevice} sx={{ mb: 1 }}>Add Device</Button>
      ) : (
        <IconButton
          size="small"
          color="primary"
          onClick={addDevice}
          sx={{ position: 'absolute', top: 8, right: 8 }}
          aria-label="Add Device"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      )}
      {devices.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
          No devices added.
        </Typography>
      ) : (
        <>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>Devices:</Typography>
              <Stack spacing={0.5}>
                {devices.map(device => (
                  <Box key={device.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Button
                      variant={activeDeviceId === device.id && device.isConnected ? 'contained' : 'outlined'}
                      color={activeDeviceId === device.id && device.isConnected ? 'primary' : 'inherit'}
                      onClick={() => device.isConnected && setActiveDeviceId(device.id)}
                      sx={{ flex: 1, justifyContent: 'flex-start', textTransform: 'none', minWidth: 0, px: 1, py: 0.5, fontSize: 14 }}
                      size="small"
                      fullWidth
                      disabled={!device.isConnected}
                    >
                      {device.name}
                    </Button>
                    {getStatusIcon(device)}
                    {device.isConnected ? (
                      <Tooltip title="Disconnect">
                        <IconButton size="small" color="secondary" onClick={() => disconnectDevice(device.id)} disabled={device.isConnecting}>
                          <LinkOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={device.isConnecting ? 'Connecting...' : 'Connect'}>
                        <IconButton size="small" color="primary" onClick={() => connectDevice(device.id)} disabled={device.isConnecting}>
                          <PowerSettingsNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
            {/* Compact Controls for active device */}
            {activeDevice && activeDevice.isConnected && (
              <Box sx={{ flex: 1, minWidth: 220, maxWidth: 320, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', mt: 2 }}>
                <DeviceControls device={activeDevice} onUpdate={update => updateDevice(activeDevice.id, update)} compact />
              </Box>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default LightsConnectionCard; 