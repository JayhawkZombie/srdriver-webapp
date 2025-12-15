import React, { createContext, useContext, useState, useCallback } from 'react';
import { BLEConnection } from '../services/BLEConnection';
import { SRDriver } from '../services/SRDriver';
import type { CommunicationLog } from '../services/SRDriver';

interface ConnectedDevice {
  id: string;
  name: string;
  srDriver: SRDriver;
  connectionType: 'ble' | 'websocket' | 'both';
  isConnected: boolean;
  lastActivity: Date;
}

type ConnectionCallback = (info: ConnectedDevice) => Promise<void>;

interface DeviceContextType {
  devices: ConnectedDevice[];
  communicationLogs: CommunicationLog[];
  isConnecting: boolean;
  error: string | null;
  
  // Device management
  connectDeviceBLE: ( callback: ConnectionCallback ) => Promise<void>;
  connectDeviceWebSocket: (ip: string, callback: ConnectionCallback ) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  getDevice: (deviceId: string) => ConnectedDevice | undefined;
  
  // Communication logging
  addCommunicationLog: (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  clearError: () => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDeviceContext = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }
  return context;
};

interface DeviceProviderProps {
  children: React.ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCommunicationLog = useCallback((log: Omit<CommunicationLog, 'id' | 'timestamp'>) => {
    const newLog: CommunicationLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setCommunicationLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setCommunicationLogs([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const connectDeviceBLE = useCallback(async (callback: ConnectionCallback) => {
    try {
      setIsConnecting(true);
      setError(null);

      const connection = new BLEConnection();
      await connection.connect();
      
      const driver = new SRDriver(connection);
      await driver.initialize();
      
      // Set up communication logging
      driver.setCommunicationLogger(addCommunicationLog);

      // Create a unique device entry
      const deviceId = `device-${Date.now()}`;
      const deviceName = `SRDriver BLE ${devices.length + 1}`;
      
      const newDevice: ConnectedDevice = {
        id: deviceId,
        name: deviceName,
        srDriver: driver,
        connectionType: 'ble',
        isConnected: true,
        lastActivity: new Date()
      };

      setDevices(prev => [...prev, newDevice]);
      await callback(newDevice);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'BLE connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, [devices.length, addCommunicationLog]);

  const connectDeviceWebSocket = useCallback(async (ip: string, callback: ConnectionCallback) => {
    try {
      setIsConnecting(true);
      setError(null);

      const driver = new SRDriver();
      await driver.connectWebSocket(ip);
      
      // Set up communication logging
      driver.setCommunicationLogger(addCommunicationLog);

      // Create a unique device entry
      const deviceId = `device-${Date.now()}`;
      const deviceName = `SRDriver WS ${devices.length + 1}`;
      
      const newDevice: ConnectedDevice = {
        id: deviceId,
        name: deviceName,
        srDriver: driver,
        connectionType: 'websocket',
        isConnected: true,
        lastActivity: new Date()
      };

      setDevices(prev => [...prev, newDevice]);
      await callback(newDevice);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'WebSocket connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, [devices.length, addCommunicationLog]);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    try {
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        await device.srDriver.disconnect();
        setDevices(prev => prev.filter(d => d.id !== deviceId));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  }, [devices]);

  const getDevice = useCallback((deviceId: string) => {
    return devices.find(d => d.id === deviceId);
  }, [devices]);

  const value: DeviceContextType = {
    devices,
    communicationLogs,
    isConnecting,
    error,
    connectDeviceBLE,
    connectDeviceWebSocket,
    disconnectDevice,
    getDevice,
    addCommunicationLog,
    clearLogs,
    clearError,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};
