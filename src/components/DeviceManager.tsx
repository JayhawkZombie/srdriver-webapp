import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Chip,
  Container,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Bluetooth as BluetoothIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import DevicePanel from './DevicePanel';
import AudioChunkerDemo from './AudioChunkerDemo';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';

interface DeviceManagerProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

const DeviceManager: React.FC<DeviceManagerProps> = ({ mode, onToggleMode }) => {
  const {
    devices,
    addDevice,
    removeDevice,
    connectDevice,
    disconnectDevice,
    updateDevice
  } = useDeviceControllerContext();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0);
  const [mainTab, setMainTab] = useState<number>(0); // 0 = Devices, 1 = Audio Chunker

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedDeviceIndex(newValue);
  };

  const selectedDevice = devices[selectedDeviceIndex];

  return (
    <>
      {/* Sidebar: fixed position */}
      <Paper sx={{
        width: 280,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            SRDriver Devices
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addDevice}
            fullWidth
            sx={{ mb: 1 }}
          >
            Add Device
          </Button>
        </Box>
        <Tabs
          orientation="vertical"
          value={selectedDeviceIndex}
          onChange={handleTabChange}
          sx={{ flexGrow: 1, borderRight: 1, borderColor: 'divider' }}
        >
          {devices.map((device, index) => (
            <Tab
              key={device.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <BluetoothIcon
                    sx={{
                      mr: 1,
                      color: device.isConnected ? 'success.main' : 'text.disabled',
                      fontSize: 16
                    }}
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'left' }}>
                    {device.name}
                  </Typography>
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      removeDevice(device.id);
                    }}
                    style={{
                      marginLeft: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="Remove device"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        removeDevice(device.id);
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </span>
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                minHeight: 64,
                px: 2,
                py: 1
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Main content area: margin-left and scrollable */}
      <Box sx={{
        ml: '280px',
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              SRDriver Dashboard
            </Typography>
            <FormControlLabel
              control={<Switch checked={mode === 'dark'} onChange={onToggleMode} color="default" />}
              label={mode === 'dark' ? 'Dark' : 'Light'}
              sx={{ mr: 2 }}
            />
            {selectedDevice && (
              <Chip
                label={selectedDevice.isConnected ? 'Connected' : 'Disconnected'}
                color={selectedDevice.isConnected ? 'success' : 'default'}
                size="small"
              />
            )}
          </Toolbar>
          <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} centered>
            <Tab label="Devices" />
            <Tab label="Audio Chunker" />
          </Tabs>
        </AppBar>
        <Container maxWidth={false} sx={{ flexGrow: 1, width: '100%', py: 1, px: 0, m: 0 }}>
          {mainTab === 0 ? (
            devices.length === 0 ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <Typography variant="h6">No devices added. Click "Add Device" to begin.</Typography>
              </Box>
            ) : (
              selectedDevice && (
                <DevicePanel
                  device={selectedDevice}
                  onConnect={() => connectDevice(selectedDevice.id)}
                  onDisconnect={() => disconnectDevice(selectedDevice.id)}
                  onUpdate={update => updateDevice(selectedDevice.id, update)}
                />
              )
            )
          ) : (
            <AudioChunkerDemo />
          )}
        </Container>
      </Box>
    </>
  );
};

export default DeviceManager;
