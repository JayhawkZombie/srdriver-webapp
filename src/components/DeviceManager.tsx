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
  Switch,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Bluetooth as BluetoothIcon,
  Close as CloseIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import DevicePanel from './DevicePanel';
import AudioChunkerDemo from './AudioChunkerDemo';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { PulseControlsProvider } from '../controllers/PulseControlsContext';
import Drawer from '@mui/material/Drawer';
import DevAppStateViewer from './DevAppStateViewer';
import { PulseToolsProvider } from '../controllers/PulseToolsContext';

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedDeviceIndex(newValue);
  };

  const selectedDevice = devices[selectedDeviceIndex];

  return (
    <>
      {/* Sidebar: collapsible hamburger menu */}
      {mainTab === 0 ? (
        <Paper sx={{
          width: 220,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1200,
          p: 1,
        }}>
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: 18, mb: 1 }}>
              SRDriver Devices
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addDevice}
              fullWidth
              sx={{ mb: 1, py: 0.5, fontSize: 14 }}
              size="small"
            >
              Add Device
            </Button>
          </Box>
          <Tabs
            orientation="vertical"
            value={selectedDeviceIndex}
            onChange={handleTabChange}
            sx={{ flexGrow: 1, borderRight: 1, borderColor: 'divider', minWidth: 0 }}
            TabIndicatorProps={{ style: { width: 3 } }}
            variant="scrollable"
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
                    <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'left', fontSize: 14 }}>
                      {device.name}
                    </Typography>
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        removeDevice(device.id);
                      }}
                      style={{
                        marginLeft: 6,
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
                  minHeight: 40,
                  px: 1,
                  py: 0.5,
                  fontSize: 14,
                  mb: 0.5
                }}
              />
            ))}
          </Tabs>
        </Paper>
      ) : (
        <>
          {!drawerOpen && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => setDrawerOpen(true)}
              sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1300 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{ sx: { width: 220, p: 1 } }}
          >
            <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: 18, mb: 1 }}>
                SRDriver Devices
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addDevice}
                fullWidth
                sx={{ mb: 1, py: 0.5, fontSize: 14 }}
                size="small"
              >
                Add Device
              </Button>
            </Box>
            <Tabs
              orientation="vertical"
              value={selectedDeviceIndex}
              onChange={handleTabChange}
              sx={{ flexGrow: 1, borderRight: 1, borderColor: 'divider', minWidth: 0 }}
              TabIndicatorProps={{ style: { width: 3 } }}
              variant="scrollable"
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
                      <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'left', fontSize: 14 }}>
                        {device.name}
                      </Typography>
                      <span
                        onClick={e => {
                          e.stopPropagation();
                          removeDevice(device.id);
                        }}
                        style={{
                          marginLeft: 6,
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
                    minHeight: 40,
                    px: 1,
                    py: 0.5,
                    fontSize: 14,
                    mb: 0.5
                  }}
                />
              ))}
            </Tabs>
          </Drawer>
        </>
      )}

      {/* Main content area: margin-left and scrollable */}
      <Box sx={{
        ml: '220px',
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        mt: 0,
        pt: 0,
      }}>
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ minHeight: 48, px: 2 }}>
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
            <DevAppStateViewer />
          </Toolbar>
          <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} centered>
            <Tab label="Devices" />
            <Tab label="Audio Chunker" />
          </Tabs>
        </AppBar>
        <Container maxWidth={false} sx={{ flexGrow: 1, width: '100%', py: 1, px: 0, m: 0 }}>
          <PulseControlsProvider>
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
              <PulseToolsProvider>
                <AudioChunkerDemo />
              </PulseToolsProvider>
            )}
          </PulseControlsProvider>
        </Container>
      </Box>
    </>
  );
};

export default DeviceManager;
