import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Stack,
  TextField
} from '@mui/material';
import {
  Bluetooth as BluetoothIcon,
  BugReport as DebugIcon,
  Palette as PaletteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { Device } from '../types/Device';
import { DEFAULT_AUTH_PIN } from '../types/srdriver';

interface DevicePanelProps {
  device: Device;
  onUpdateDevice: (updates: Partial<Device>) => void;
}

// Utility functions for color conversion
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Pattern names for the 9 available patterns
const patternNames = [
  'Pattern 0',
  'Pattern 1', 
  'Pattern 2',
  'Pattern 3',
  'Pattern 4',
  'Pattern 5',
  'Pattern 6',
  'Pattern 7',
  'Pattern 8'
];

const DevicePanel: React.FC<DevicePanelProps> = ({ device, onUpdateDevice }) => {
  const [pin, setPin] = useState(DEFAULT_AUTH_PIN);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleConnect = async () => {
    onUpdateDevice({ isConnecting: true, error: null });
    try {
      await device.controller.connect();
      onUpdateDevice({ isConnected: true });
      
      // Set up authentication change callback
      device.controller.onAuthenticationChange = (authenticated: boolean) => {
        onUpdateDevice({ isAuthenticated: authenticated });
      };
      
      // Read current values from device
      try {
        const brightness = await device.controller.getBrightness();
        onUpdateDevice({ brightness });
      } catch {}
      
      try {
        const patternIndex = await device.controller.getPattern();
        onUpdateDevice({ patternIndex });
      } catch {}
      
      try {
        const highColor = await device.controller.getHighColor();
        onUpdateDevice({ highColor, savedHighColor: highColor });
      } catch {}
      
      try {
        const lowColor = await device.controller.getLowColor();
        onUpdateDevice({ lowColor, savedLowColor: lowColor });
      } catch {}
    } catch (e: any) {
      onUpdateDevice({ error: e.message || 'Failed to connect' });
    } finally {
      onUpdateDevice({ isConnecting: false });
    }
  };

  const handleDisconnect = async () => {
    onUpdateDevice({ isConnecting: true, error: null });
    try {
      await device.controller.disconnect();
      onUpdateDevice({ isConnected: false, isAuthenticated: false });
    } catch (e: any) {
      onUpdateDevice({ error: e.message || 'Failed to disconnect' });
    } finally {
      onUpdateDevice({ isConnecting: false });
    }
  };

  const handleAuthenticate = async () => {
    if (!device.isConnected) return;
    
    setIsAuthenticating(true);
    try {
      const success = await device.controller.authenticate(pin);
      if (!success) {
        onUpdateDevice({ error: 'Authentication failed - wrong PIN' });
      }
    } catch (e: any) {
      onUpdateDevice({ error: e.message || 'Authentication failed' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDebug = async () => {
    try {
      await device.controller.debugDeviceDiscovery();
    } catch (e: any) {
      onUpdateDevice({ error: e.message || 'Debug failed' });
    }
  };

  const handleBrightnessChange = async (event: Event, value: number | number[]) => {
    const brightness = value as number;
    onUpdateDevice({ brightness });
    if (device.isConnected && device.isAuthenticated) {
      try {
        await device.controller.setBrightness(brightness);
      } catch (e: any) {
        onUpdateDevice({ error: e.message || 'Failed to set brightness' });
      }
    }
  };

  const handlePatternChange = async (event: any) => {
    const patternIndex = Number(event.target.value);
    onUpdateDevice({ patternIndex });
    if (device.isConnected && device.isAuthenticated) {
      try {
        await device.controller.setPattern(patternIndex);
      } catch (e: any) {
        onUpdateDevice({ error: e.message || 'Failed to set pattern' });
      }
    }
  };

  const handleHighColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDevice({ highColor: hexToRgb(event.target.value) });
  };

  const handleLowColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDevice({ lowColor: hexToRgb(event.target.value) });
  };

  const handleSaveColors = async () => {
    if (device.isConnected && device.isAuthenticated) {
      try {
        await device.controller.setHighColor(device.highColor);
        await device.controller.setLowColor(device.lowColor);
        
        onUpdateDevice({
          savedHighColor: device.highColor,
          savedLowColor: device.lowColor
        });
      } catch (e: any) {
        onUpdateDevice({ error: e.message || 'Failed to save colors' });
      }
    }
  };

  return (
    <Box>
      {/* Connection Status and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {device.name}
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant={device.isConnected ? "outlined" : "contained"}
              startIcon={<BluetoothIcon />}
              onClick={device.isConnected ? handleDisconnect : handleConnect}
              disabled={device.isConnecting}
            >
              {device.isConnecting 
                ? (device.isConnected ? 'Disconnecting...' : 'Connecting...') 
                : (device.isConnected ? 'Disconnect' : 'Connect')
              }
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DebugIcon />}
              onClick={handleDebug}
              color="warning"
            >
              Debug BLE
            </Button>
          </Stack>

          {/* Authentication Status */}
          {device.isConnected && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={device.isAuthenticated ? <LockOpenIcon /> : <LockIcon />}
                  label={device.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  color={device.isAuthenticated ? 'success' : 'warning'}
                  variant="outlined"
                />
                
                {!device.isAuthenticated && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      label="PIN"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      size="small"
                      sx={{ width: 120 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAuthenticate}
                      disabled={isAuthenticating}
                      size="small"
                    >
                      {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
                    </Button>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {device.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {device.error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Device Controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Brightness and Pattern Controls */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Brightness Control */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Brightness
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={device.brightness}
                  onChange={handleBrightnessChange}
                  min={0}
                  max={255}
                  disabled={!device.isConnected || !device.isAuthenticated}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0' },
                    { value: 128, label: '128' },
                    { value: 255, label: '255' }
                  ]}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Current: {device.brightness}
              </Typography>
            </CardContent>
          </Card>

          {/* Pattern Control */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pattern
              </Typography>
              <FormControl fullWidth disabled={!device.isConnected || !device.isAuthenticated}>
                <InputLabel>Select Pattern</InputLabel>
                <Select
                  value={device.patternIndex}
                  label="Select Pattern"
                  onChange={handlePatternChange}
                >
                  {patternNames.map((name, index) => (
                    <MenuItem key={index} value={index}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Box>

        {/* Color Controls */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Color Settings
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* High Color */}
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Typography variant="subtitle1" gutterBottom>
                  High Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <input
                    type="color"
                    value={rgbToHex(device.highColor.r, device.highColor.g, device.highColor.b)}
                    onChange={handleHighColorChange}
                    disabled={!device.isConnected || !device.isAuthenticated}
                    style={{ width: 50, height: 40, border: 'none', borderRadius: 4 }}
                  />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current:
                    </Typography>
                    <Chip
                      label=""
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: rgbToHex(
                          device.savedHighColor.r, 
                          device.savedHighColor.g, 
                          device.savedHighColor.b
                        ),
                        border: '1px solid #ccc'
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Low Color */}
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Low Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <input
                    type="color"
                    value={rgbToHex(device.lowColor.r, device.lowColor.g, device.lowColor.b)}
                    onChange={handleLowColorChange}
                    disabled={!device.isConnected || !device.isAuthenticated}
                    style={{ width: 50, height: 40, border: 'none', borderRadius: 4 }}
                  />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current:
                    </Typography>
                    <Chip
                      label=""
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: rgbToHex(
                          device.savedLowColor.r, 
                          device.savedLowColor.g, 
                          device.savedLowColor.b
                        ),
                        border: '1px solid #ccc'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveColors}
                disabled={!device.isConnected || !device.isAuthenticated}
                startIcon={<PaletteIcon />}
              >
                Save Colors
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DevicePanel; 