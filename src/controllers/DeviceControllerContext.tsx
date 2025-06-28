import React, { createContext, useContext, useState, useCallback } from 'react';
import { WebSRDriverController } from './WebSRDriverController';
import { Device } from '../types/Device';
import { Box, Button, Typography, Stack, Chip } from '@mui/material';
import { useAppStore } from '../store/appStore';

export type DeviceControllerContextType = {
  devices: Device[];
  addDevice: () => void;
  removeDevice: (deviceId: string) => void;
  connectDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  updateDevice: (deviceId: string, update: Partial<Device>) => void;
};

const DeviceControllerContext = createContext<DeviceControllerContextType | undefined>(undefined);

export const DeviceControllerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const devicesMetadata = useAppStore(state => state.devicesMetadata);
  const setDeviceNickname = useAppStore(state => state.setDeviceNickname);

  const addDevice = useCallback(() => {
    const uniqueId = `device-${Date.now()}`;
    const newDevice: Device = {
      id: uniqueId,
      name: `SRDriver ${devices.length + 1}`,
      controller: new WebSRDriverController(),
      isConnected: false,
      isConnecting: false,
      error: null,
      brightness: 128,
      patternIndex: 0,
      speed: 1,
      highColor: { r: 255, g: 255, b: 255 },
      lowColor: { r: 0, g: 0, b: 0 },
      savedHighColor: { r: 255, g: 255, b: 255 },
      savedLowColor: { r: 0, g: 0, b: 0 },
      leftSeriesCoefficients: [0.0, 0.0, 0.0],
      rightSeriesCoefficients: [0.0, 0.0, 0.0],
      savedLeftSeriesCoefficients: [0.0, 0.0, 0.0],
      savedRightSeriesCoefficients: [0.0, 0.0, 0.0],
      macOrId: uniqueId,
    };
    setDevices(prev => [...prev, newDevice]);
  }, [devices.length]);

  const removeDevice = useCallback((deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
  }, []);

  const connectDevice = useCallback(async (deviceId: string) => {
    setDevices(prev => prev.map(device =>
      device.id === deviceId ? { ...device, isConnecting: true, error: null } : device
    ));
    try {
      setDevices(prev => prev.map(device => {
        if (device.id === deviceId) {
          return { ...device, isConnecting: true, error: null };
        }
        return device;
      }));
      const device = devices.find(d => d.id === deviceId);
      if (!device) throw new Error('Device not found');
      await device.controller.connect();
      const realId = device.controller.getDeviceId();
      if (realId && device.macOrId !== realId) {
        const oldNickname = devicesMetadata[device.macOrId]?.nickname;
        if (oldNickname) {
          setDeviceNickname(realId, oldNickname);
        }
        setDevices(prev => prev.map(d =>
          d.id === deviceId ? { ...d, macOrId: realId } : d
        ));
      }
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, isConnected: true, isConnecting: false, error: null } : d
      ));
    } catch (e: any) {
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, isConnected: false, isConnecting: false, error: e.message || 'Failed to connect' } : d
      ));
    }
  }, [devices, devicesMetadata, setDeviceNickname]);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    try {
      await device.controller.disconnect();
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, isConnected: false, isConnecting: false } : d
      ));
    } catch (e: any) {
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, error: e.message || 'Failed to disconnect' } : d
      ));
    }
  }, [devices]);

  const updateDevice = useCallback((deviceId: string, update: Partial<Device>) => {
    setDevices(prev => prev.map(d =>
      d.id === deviceId ? { ...d, ...update } : d
    ));
  }, []);

  return (
    <DeviceControllerContext.Provider value={{ devices, addDevice, removeDevice, connectDevice, disconnectDevice, updateDevice }}>
      {children}
    </DeviceControllerContext.Provider>
  );
};

export function useDeviceControllerContext() {
  const ctx = useContext(DeviceControllerContext);
  if (!ctx) throw new Error('useDeviceControllerContext must be used within a DeviceControllerProvider');
  return ctx;
}

// DeviceConnectionPanel UI for connecting/disconnecting devices
export const DeviceConnectionPanel: React.FC = () => {
  const { devices, connectDevice, disconnectDevice, addDevice } = useDeviceControllerContext();

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Device Connection</Typography>
      <Stack spacing={2}>
        {devices.length === 0 ? (
          <Button variant="contained" onClick={addDevice}>Add Device</Button>
        ) : (
          devices.map(device => (
            <Box key={device.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">{device.name}</Typography>
              <Chip
                label={device.isConnected ? 'Connected' : device.isConnecting ? 'Connecting...' : 'Disconnected'}
                color={device.isConnected ? 'success' : device.isConnecting ? 'warning' : 'default'}
                size="small"
              />
              {device.isConnected ? (
                <Button size="small" variant="outlined" color="secondary" onClick={() => disconnectDevice(device.id)} disabled={device.isConnecting}>
                  Disconnect
                </Button>
              ) : (
                <Button size="small" variant="contained" color="primary" onClick={() => connectDevice(device.id)} disabled={device.isConnecting}>
                  {device.isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </Box>
          ))
        )}
      </Stack>
    </Box>
  );
};

// --- Single Device Context ---
const SingleDeviceContext = createContext<Device | undefined>(undefined);
export const SingleDeviceProvider = SingleDeviceContext.Provider;
export function useSingleDevice() {
  const ctx = useContext(SingleDeviceContext);
  if (!ctx) throw new Error('useSingleDevice must be used within SingleDeviceProvider');
  return ctx;
} 