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
  Alert,
  Container,
  Card,
  CardContent,
  IconButton,
  Chip,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  Bluetooth as BluetoothIcon,
  BugReport as DebugIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { WebSRDriverController } from './controllers/WebSRDriverController';
import { Device } from './types/Device';
import DevicePanel from './components/DevicePanel';
import './App.css';

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0);
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  const getInitialMode = () => {
    const saved = localStorage.getItem('colorMode');
    if (saved === 'light' || saved === 'dark') return saved;
    // fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialMode());
  const theme = createTheme({ palette: { mode } });
  const handleToggle = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  const addDevice = () => {
    const newDevice: Device = {
      id: `device-${Date.now()}`,
      name: `SRDriver ${devices.length + 1}`,
      controller: new WebSRDriverController(),
      isConnected: false,
      isConnecting: false,
      error: null,
      brightness: 128,
      patternIndex: 0,
      speed: 1,
      highColor: {r: 255, g: 255, b: 255},
      lowColor: {r: 0, g: 0, b: 0},
      savedHighColor: {r: 255, g: 255, b: 255},
      savedLowColor: {r: 0, g: 0, b: 0},
      leftSeriesCoefficients: [0.0, 0.0, 0.0],
      rightSeriesCoefficients: [0.0, 0.0, 0.0],
      savedLeftSeriesCoefficients: [0.0, 0.0, 0.0],
      savedRightSeriesCoefficients: [0.0, 0.0, 0.0]
    };
    
    setDevices([...devices, newDevice]);
    setSelectedDeviceIndex(devices.length);
  };

  const removeDevice = (deviceId: string) => {
    const deviceIndex = devices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
      const updatedDevices = devices.filter(d => d.id !== deviceId);
      setDevices(updatedDevices);
      
      // Adjust selected index if needed
      if (updatedDevices.length === 0) {
        setSelectedDeviceIndex(0);
      } else if (selectedDeviceIndex >= updatedDevices.length) {
        setSelectedDeviceIndex(updatedDevices.length - 1);
      }
    }
  };

  const updateDevice = (deviceId: string, updates: Partial<Device>) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.id === deviceId ? { ...device, ...updates } : device
      )
    );
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedDeviceIndex(newValue);
  };

  const selectedDevice = devices[selectedDeviceIndex];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Left sidebar with device tabs */}
        <Paper sx={{ width: 280, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              SRDriver Devices
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addDevice}
              disabled={isAddingDevice}
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

        {/* Main content area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                SRDriver Dashboard
              </Typography>
              <FormControlLabel
                control={<Switch checked={mode === 'dark'} onChange={handleToggle} color="default" />}
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
          </AppBar>

          <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3 }}>
            {devices.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <BluetoothIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Devices Connected
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Click "Add Device" to connect to an SRDriver
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addDevice}
                  size="large"
                >
                  Add Your First Device
                </Button>
              </Box>
            ) : selectedDevice ? (
              <DevicePanel
                device={selectedDevice}
                onUpdateDevice={(updates) => updateDevice(selectedDevice.id, updates)}
              />
            ) : null}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;

