import React, { createContext, useContext, useState, useCallback } from 'react';
import { WebSRDriverController } from './WebSRDriverController';
import { Device } from '../types/Device';

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

  const addDevice = useCallback(() => {
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
      highColor: { r: 255, g: 255, b: 255 },
      lowColor: { r: 0, g: 0, b: 0 },
      savedHighColor: { r: 255, g: 255, b: 255 },
      savedLowColor: { r: 0, g: 0, b: 0 },
      leftSeriesCoefficients: [0.0, 0.0, 0.0],
      rightSeriesCoefficients: [0.0, 0.0, 0.0],
      savedLeftSeriesCoefficients: [0.0, 0.0, 0.0],
      savedRightSeriesCoefficients: [0.0, 0.0, 0.0],
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
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, isConnected: true, isConnecting: false, error: null } : d
      ));
    } catch (e: any) {
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, isConnected: false, isConnecting: false, error: e.message || 'Failed to connect' } : d
      ));
    }
  }, [devices]);

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