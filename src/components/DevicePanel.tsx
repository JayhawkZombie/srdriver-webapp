import React, { useState, useEffect } from 'react';
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
  LockOpen as LockOpenIcon,
  Functions as FunctionsIcon
} from '@mui/icons-material';
import { Device } from '../types/Device';

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
  const [pulseDuration, setPulseDuration] = useState(1000);
  const [pulseTargetBrightness, setPulseTargetBrightness] = useState(255);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (!device.controller) return;

    // Color notifications
    device.controller.onHighColorChange = (color) => {
      onUpdateDevice({ highColor: color, savedHighColor: color });
    };
    device.controller.onLowColorChange = (color) => {
      onUpdateDevice({ lowColor: color, savedLowColor: color });
    };

    // Series coefficients notifications
    device.controller.onLeftSeriesCoefficientsChange = (coeffs) => {
      onUpdateDevice({ leftSeriesCoefficients: coeffs, savedLeftSeriesCoefficients: coeffs });
    };
    device.controller.onRightSeriesCoefficientsChange = (coeffs) => {
      onUpdateDevice({ rightSeriesCoefficients: coeffs, savedRightSeriesCoefficients: coeffs });
    };

    // Pattern change
    device.controller.onPatternChange = (patternIndex) => {
      onUpdateDevice({ patternIndex });
    };

    // Brightness change
    device.controller.onBrightnessChange = (brightness) => {
      onUpdateDevice({ brightness });
    };

    // Speed change
    device.controller.onSpeedChange = (speed) => {
      onUpdateDevice({ speed });
    };

    // Clean up on unmount
    return () => {
      device.controller.onHighColorChange = undefined;
      device.controller.onLowColorChange = undefined;
      device.controller.onLeftSeriesCoefficientsChange = undefined;
      device.controller.onRightSeriesCoefficientsChange = undefined;
      device.controller.onPatternChange = undefined;
      device.controller.onBrightnessChange = undefined;
      device.controller.onSpeedChange = undefined;
    };
  }, [device.controller, onUpdateDevice]);

  const handleConnect = async () => {
    onUpdateDevice({ isConnecting: true, error: null });
    try {
      await device.controller.connect();
      onUpdateDevice({ isConnected: true });
      // Read current values from device
      try {
        const brightness = await device.controller.getBrightness();
        onUpdateDevice({ brightness });
      } catch {}
      try {
        const speed = await device.controller.getSpeed();
        onUpdateDevice({ speed });
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
      try {
        const leftCoeffs = await device.controller.getLeftSeriesCoefficients();
        onUpdateDevice({ leftSeriesCoefficients: leftCoeffs, savedLeftSeriesCoefficients: leftCoeffs });
      } catch {}
      try {
        const rightCoeffs = await device.controller.getRightSeriesCoefficients();
        onUpdateDevice({ rightSeriesCoefficients: rightCoeffs, savedRightSeriesCoefficients: rightCoeffs });
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
      onUpdateDevice({ isConnected: false });
    } catch (e: any) {
      onUpdateDevice({ error: e.message || 'Failed to disconnect' });
    } finally {
      onUpdateDevice({ isConnecting: false });
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
    if (device.isConnected) {
      try {
        await device.controller.setBrightness(brightness);
      } catch (e: any) {
        onUpdateDevice({ error: e.message || 'Failed to set brightness' });
      }
    }
  };

  const handleSpeedChange = async (event: Event, value: number | number[]) => {
    const speed = value as number;
    onUpdateDevice({ speed });
    if (device.isConnected) {
      try {
        await device.controller.setSpeed(speed);
      } catch (e: any) {
        onUpdateDevice({ error: e.message || 'Failed to set speed' });
      }
    }
  };

  const handlePatternChange = async (event: any) => {
    const patternIndex = Number(event.target.value);
    onUpdateDevice({ patternIndex });
    if (device.isConnected) {
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
    if (device.isConnected) {
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

  const handleLeftSeriesCoefficientsChange = (index: number, value: number) => {
    const newCoeffs: [number, number, number] = [...device.leftSeriesCoefficients];
    newCoeffs[index] = value;
    onUpdateDevice({ leftSeriesCoefficients: newCoeffs });
  };

  const handleRightSeriesCoefficientsChange = (index: number, value: number) => {
    const newCoeffs: [number, number, number] = [...device.rightSeriesCoefficients];
    newCoeffs[index] = value;
    onUpdateDevice({ rightSeriesCoefficients: newCoeffs });
  };

  const handleSaveSeriesCoefficients = async () => {
    if (device.isConnected) {
      try {
        await device.controller.setLeftSeriesCoefficients(device.leftSeriesCoefficients);
        await device.controller.setRightSeriesCoefficients(device.rightSeriesCoefficients);
        // Read back the actual values from the device to ensure UI is in sync
        try {
          const leftCoeffs = await device.controller.getLeftSeriesCoefficients();
          onUpdateDevice({ leftSeriesCoefficients: leftCoeffs, savedLeftSeriesCoefficients: leftCoeffs });
        } catch {}
        try {
          const rightCoeffs = await device.controller.getRightSeriesCoefficients();
          onUpdateDevice({ rightSeriesCoefficients: rightCoeffs, savedRightSeriesCoefficients: rightCoeffs });
        } catch {}
      } catch (e: any) {
        onUpdateDevice({ error: e.message || 'Failed to save series coefficients' });
      }
    }
  };

  const handlePulseBrightness = async () => {
    if (device.isConnected) {
      setIsPulsing(true);
      try {
        await device.controller.pulseBrightness(pulseTargetBrightness, pulseDuration);
        // Reset pulsing state after the duration
        setTimeout(() => {
          setIsPulsing(false);
        }, pulseDuration);
      } catch (e: any) {
        onUpdateDevice({ error: e.message || 'Failed to send pulse command' });
        setIsPulsing(false);
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
                  disabled={!device.isConnected}
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

          {/* Speed Control */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Speed
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={device.speed}
                  onChange={handleSpeedChange}
                  min={0}
                  max={100}
                  disabled={!device.isConnected}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' }
                  ]}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Current: {device.speed}
              </Typography>
            </CardContent>
          </Card>

          {/* Pattern Control */}
          <Card sx={{ flex: 1, minWidth: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pattern
              </Typography>
              <FormControl fullWidth disabled={!device.isConnected}>
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

        {/* Pulse Control */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Brightness Pulse
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Target Brightness"
                type="number"
                value={pulseTargetBrightness}
                onChange={(e) => setPulseTargetBrightness(Number(e.target.value))}
                disabled={!device.isConnected}
                size="small"
                sx={{ width: 150 }}
                inputProps={{ min: 0, max: 255, step: 1 }}
                helperText="0-255"
              />
              <TextField
                label="Duration (ms)"
                type="number"
                value={pulseDuration}
                onChange={(e) => setPulseDuration(Number(e.target.value))}
                disabled={!device.isConnected}
                size="small"
                sx={{ width: 150 }}
                inputProps={{ min: 100, max: 10000, step: 100 }}
                helperText="100-10000ms"
              />
              <Button
                variant="contained"
                onClick={handlePulseBrightness}
                disabled={!device.isConnected || isPulsing}
                color="secondary"
              >
                {isPulsing ? 'Pulsing...' : 'Pulse Brightness'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Pulses brightness to the target level and returns to previous level over the specified duration.
            </Typography>
          </CardContent>
        </Card>

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
                    disabled={!device.isConnected}
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
                    disabled={!device.isConnected}
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
                disabled={!device.isConnected}
                startIcon={<PaletteIcon />}
              >
                Save Colors
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Series Coefficients Controls */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FunctionsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Series Coefficients
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* Left Series Coefficients */}
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Left Series Coefficients
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Coefficient 1: {device.leftSeriesCoefficients[0].toFixed(2)}
                  </Typography>
                  <Slider
                    value={device.leftSeriesCoefficients[0]}
                    onChange={(event, value) => handleLeftSeriesCoefficientsChange(0, value as number)}
                    min={-2}
                    max={2}
                    step={0.01}
                    disabled={!device.isConnected}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -2, label: '-2' },
                      { value: 0, label: '0' },
                      { value: 2, label: '2' }
                    ]}
                  />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Coefficient 2: {device.leftSeriesCoefficients[1].toFixed(2)}
                  </Typography>
                  <Slider
                    value={device.leftSeriesCoefficients[1]}
                    onChange={(event, value) => handleLeftSeriesCoefficientsChange(1, value as number)}
                    min={-2}
                    max={2}
                    step={0.01}
                    disabled={!device.isConnected}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -2, label: '-2' },
                      { value: 0, label: '0' },
                      { value: 2, label: '2' }
                    ]}
                  />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Coefficient 3: {device.leftSeriesCoefficients[2].toFixed(2)}
                  </Typography>
                  <Slider
                    value={device.leftSeriesCoefficients[2]}
                    onChange={(event, value) => handleLeftSeriesCoefficientsChange(2, value as number)}
                    min={-2}
                    max={2}
                    step={0.01}
                    disabled={!device.isConnected}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -2, label: '-2' },
                      { value: 0, label: '0' },
                      { value: 2, label: '2' }
                    ]}
                  />
                </Box>
              </Box>

              {/* Right Series Coefficients */}
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Right Series Coefficients
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Coefficient 1: {device.rightSeriesCoefficients[0].toFixed(2)}
                  </Typography>
                  <Slider
                    value={device.rightSeriesCoefficients[0]}
                    onChange={(event, value) => handleRightSeriesCoefficientsChange(0, value as number)}
                    min={-2}
                    max={2}
                    step={0.01}
                    disabled={!device.isConnected}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -2, label: '-2' },
                      { value: 0, label: '0' },
                      { value: 2, label: '2' }
                    ]}
                  />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Coefficient 2: {device.rightSeriesCoefficients[1].toFixed(2)}
                  </Typography>
                  <Slider
                    value={device.rightSeriesCoefficients[1]}
                    onChange={(event, value) => handleRightSeriesCoefficientsChange(1, value as number)}
                    min={-2}
                    max={2}
                    step={0.01}
                    disabled={!device.isConnected}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -2, label: '-2' },
                      { value: 0, label: '0' },
                      { value: 2, label: '2' }
                    ]}
                  />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Coefficient 3: {device.rightSeriesCoefficients[2].toFixed(2)}
                  </Typography>
                  <Slider
                    value={device.rightSeriesCoefficients[2]}
                    onChange={(event, value) => handleRightSeriesCoefficientsChange(2, value as number)}
                    min={-2}
                    max={2}
                    step={0.01}
                    disabled={!device.isConnected}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: -2, label: '-2' },
                      { value: 0, label: '0' },
                      { value: 2, label: '2' }
                    ]}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveSeriesCoefficients}
                disabled={!device.isConnected}
                startIcon={<FunctionsIcon />}
              >
                Save Series Coefficients
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DevicePanel; 