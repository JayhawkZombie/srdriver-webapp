import React, { createContext, useContext, useState, useCallback } from 'react';
import { WebSRDriverController } from './WebSRDriverController';
import type { Device } from '../types/Device';
import type { DeviceMetadata } from '../store/appStore';
import { Box, Button, Typography, Stack } from '@mui/material';
import { useAppStore } from '../store/appStore';
import AnimatedStatusChip from '../components/AnimatedStatusChip';
import FavoriteIcon from '@mui/icons-material/Favorite';

export type DeviceControllerContextType = {
  devices: Device[];
  addDevice: (metadata: DeviceMetadata) => void;
  removeDevice: (deviceId: string) => void;
  connectDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  updateDevice: (deviceId: string, update: Partial<Device>) => void;
  onHeartbeatChange: (deviceId: string, cb: (isAlive: boolean) => void) => () => void;
  onHeartbeat: (deviceId: string, cb: () => void) => () => void;
};

const DeviceControllerContext = createContext<DeviceControllerContextType | undefined>(undefined);

const HEARTBEAT_UUID = 'f6f7b0f1-c4ab-4c75-9ca7-b43972152f16';

// WeakMap to track heartbeat event handlers for each characteristic
const heartbeatHandlerMap: WeakMap<BluetoothRemoteGATTCharacteristic, (event: Event) => void> = new WeakMap();
// Ref to track which device IDs have active listeners
const activeHeartbeatListeners = new Set<string>();

// Heartbeat context for decoupled heartbeat/pulse state
type HeartbeatStatus = { last: number | null; isAlive: boolean; pulse: number | null };
type HeartbeatMap = { [deviceId: string]: HeartbeatStatus };
const HeartbeatContext = createContext<{
  heartbeat: HeartbeatMap;
  setHeartbeat: React.Dispatch<React.SetStateAction<HeartbeatMap>>;
} | undefined>(undefined);

export const HeartbeatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [heartbeat, setHeartbeat] = useState<HeartbeatMap>({});
  return (
    <HeartbeatContext.Provider value={{ heartbeat, setHeartbeat }}>
      {children}
    </HeartbeatContext.Provider>
  );
};

export function useHeartbeatStatus(deviceId: string | undefined) {
  const ctx = useContext(HeartbeatContext);
  if (!ctx) throw new Error('useHeartbeatStatus must be used within HeartbeatProvider');
  return deviceId ? ctx.heartbeat[deviceId] : undefined;
}

// HeartbeatManager: subscribes to device context and manages heartbeat BLE subscriptions/state
const HeartbeatManager: React.FC = () => {
  const { devices } = useDeviceControllerContext();
  const { setHeartbeat } = useContext(HeartbeatContext)!;
  React.useEffect(() => {
    const connectedDevices = devices.filter(d => d.isConnected && d.controller && typeof d.controller.getService === 'function');
    connectedDevices.forEach(device => {
      if (activeHeartbeatListeners.has(device.browserId)) return;
      let char: BluetoothRemoteGATTCharacteristic | null = null;
      let handler: ((event: Event) => void) | null = null;
      const cancelled = false;
      (async () => {
        try {
          const service = device.controller.getService();
          if (!service) return;
          char = await service.getCharacteristic(HEARTBEAT_UUID);
          await char.startNotifications();
          const prevHandler = heartbeatHandlerMap.get(char);
          if (prevHandler) {
            char.removeEventListener('characteristicvaluechanged', prevHandler);
          }
          handler = (_event: Event) => {
            if (cancelled) return;
            const now = Date.now();
            setHeartbeat(prev => {
              const newState = {
                ...prev,
                [device.browserId]: {
                  last: now,
                  isAlive: true,
                  pulse: now,
                },
              };
              return newState;
            });
            // Fire all onHeartbeat callbacks for this device
            if (heartbeatEventCallbacks.current[device.browserId]) {
              heartbeatEventCallbacks.current[device.browserId].forEach(cb => cb());
            }
            setTimeout(() => {
              setHeartbeat(prev => {
                if (!prev[device.browserId]) return prev;
                const newState = {
                  ...prev,
                  [device.browserId]: { ...prev[device.browserId], pulse: null }
                };
                return newState;
              });
            }, 300);
          };
          char.addEventListener('characteristicvaluechanged', handler);
          heartbeatHandlerMap.set(char, handler);
          activeHeartbeatListeners.add(device.browserId);
        } catch (_err) {
          // ignore
        }
      })();
    });
    Array.from(activeHeartbeatListeners).forEach(deviceId => {
      const stillConnected = connectedDevices.some(d => d.browserId === deviceId);
      if (!stillConnected) {
        const device = devices.find(d => d.browserId === deviceId);
        if (device && device.controller && typeof device.controller.getService === 'function') {
          (async () => {
            try {
              const service = device.controller.getService();
              if (!service) return;
              const char = await service.getCharacteristic(HEARTBEAT_UUID);
              const handler = heartbeatHandlerMap.get(char);
              if (handler) {
                char.removeEventListener('characteristicvaluechanged', handler);
                heartbeatHandlerMap.delete(char);
              }
            } catch (_err) {
              // ignore
            }
          })();
        }
        activeHeartbeatListeners.delete(deviceId);
      }
    });
  }, [devices, setHeartbeat]);
  return null;
};

// Heartbeat change callbacks (global for HeartbeatManager and context)
const heartbeatCallbacks: React.MutableRefObject<{ [deviceId: string]: ((isAlive: boolean) => void)[] }> = { current: {} };
// Heartbeat event callbacks (fires on every heartbeat)
const heartbeatEventCallbacks: React.MutableRefObject<{ [deviceId: string]: (() => void)[] }> = { current: {} };

// Controller map context for deviceId -> WebSRDriverController
const DeviceControllerMapContext = React.createContext<{ getController: (id: string) => WebSRDriverController | undefined }>({ getController: () => undefined });

export const DeviceControllerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const controllerMapRef = React.useRef<{ [id: string]: WebSRDriverController }>({});

  // Add device to context after successful connection, using DeviceMetadata
  const addDevice = useCallback((metadata: DeviceMetadata) => {
    if (!metadata.browserId) {
      console.error('Attempted to add device with undefined browserId:', metadata);
      return;
    }
    const newDevice: Device = {
      name: metadata.name,
      controller: controllerMapRef.current[metadata.browserId],
      isConnected: true,
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
      browserId: metadata.browserId,
    };
    setDevices(prev => [...prev, newDevice]);
  }, []);

  const removeDevice = useCallback((deviceId: string) => {
    delete controllerMapRef.current[deviceId];
    setDevices(prev => prev.filter(d => d.browserId !== deviceId));
  }, []);

  // Only add device after successful connection
  const connectDevice = useCallback(async (deviceId: string) => {
    setDevices(prev => prev.map(device =>
      device.browserId === deviceId ? { ...device, isConnecting: true, error: null } : device
    ));
    useAppStore.getState().setDeviceConnection(deviceId, { isConnecting: true, error: null });
    try {
      let controller = controllerMapRef.current[deviceId];
      if (!controller) {
        controller = new WebSRDriverController();
      }
      await controller.connect();
      const browserId = controller.getDeviceId();
      if (!browserId) {
        console.error('controller.deviceId is undefined after connect! Device not added.');
        setDevices(prev => prev.map(d =>
          d.browserId === deviceId ? { ...d, isConnected: false, isConnecting: false, error: 'Failed to get device ID' } : d
        ));
        useAppStore.getState().setDeviceConnection(deviceId, { isConnected: false, isConnecting: false, error: 'Failed to get device ID' });
        return;
      }
      controllerMapRef.current[browserId] = controller; // Only add after connect
      const metadata: DeviceMetadata = {
        browserId,
        name: controller.getDeviceName() || 'SRDriver',
        nickname: '',
        group: null,
        tags: [],
        typeInfo: { model: '', firmwareVersion: '', numLEDs: 0, ledLayout: 'strip', capabilities: [] },
      };
      useAppStore.getState().addDevice(metadata);
      addDevice(metadata);
      controller.pingForRTT();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setDevices(prev => prev.map(d =>
        d.browserId === deviceId ? { ...d, isConnected: false, isConnecting: false, error: error.message || 'Failed to connect' } : d
      ));
      useAppStore.getState().setDeviceConnection(deviceId, { isConnected: false, isConnecting: false, error: error.message || 'Failed to connect' });
    }
  }, [addDevice]);

  const disconnectDevice = useCallback(async (deviceId: string) => {
    const controller = controllerMapRef.current[deviceId];
    if (!controller) return;
    // Fire & forget disconnect
    controller.disconnect();
    setDevices(prev => prev.map(d =>
      d.browserId === deviceId ? { ...d, isConnected: false, isConnecting: false } : d
    ));
    useAppStore.getState().setDeviceConnection(deviceId, { isConnected: false, isConnecting: false });
  }, []);

  const updateDevice = useCallback((deviceId: string, update: Partial<Device>) => {
    setDevices(prev => prev.map(d =>
      d.browserId === deviceId ? { ...d, ...update } : d
    ));
  }, []);

  const onHeartbeatChange = useCallback((deviceId: string, cb: (isAlive: boolean) => void) => {
    if (!heartbeatCallbacks.current[deviceId]) {
      heartbeatCallbacks.current[deviceId] = [];
    }
    heartbeatCallbacks.current[deviceId].push(cb);
    // Return unsubscribe function
    return () => {
      heartbeatCallbacks.current[deviceId] = heartbeatCallbacks.current[deviceId].filter((f: (isAlive: boolean) => void) => f !== cb);
    };
  }, []);

  const onHeartbeat = useCallback((deviceId: string, cb: () => void) => {
    if (!heartbeatEventCallbacks.current[deviceId]) {
      heartbeatEventCallbacks.current[deviceId] = [];
    }
    heartbeatEventCallbacks.current[deviceId].push(cb);
    // Return unsubscribe function
    return () => {
      heartbeatEventCallbacks.current[deviceId] = heartbeatEventCallbacks.current[deviceId].filter((f: () => void) => f !== cb);
    };
  }, []);

  return (
    <HeartbeatProvider>
      <DeviceControllerMapContext.Provider value={{ getController: (id) => controllerMapRef.current[id] }}>
        <DeviceControllerContext.Provider value={{ devices, addDevice, removeDevice, connectDevice, disconnectDevice, updateDevice, onHeartbeatChange, onHeartbeat }}>
          <HeartbeatManager />
          {children}
        </DeviceControllerContext.Provider>
      </DeviceControllerMapContext.Provider>
    </HeartbeatProvider>
  );
};

export function useDeviceControllerContext() {
  const ctx = useContext(DeviceControllerContext);
  if (!ctx) throw new Error('useDeviceControllerContext must be used within a DeviceControllerProvider');
  return ctx;
}

export function useDeviceControllerMap() {
  return React.useContext(DeviceControllerMapContext);
}

// DeviceConnectionPanel UI for connecting/disconnecting devices
export const DeviceConnectionPanel: React.FC = () => {
  const { devices, connectDevice, disconnectDevice } = useDeviceControllerContext();

  // Use a stable callback to avoid runaway subscriptions
  const heartbeatLogger = React.useCallback(() => {
  }, []);
  useHeartbeat(devices[0]?.browserId, heartbeatLogger);

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Device Connection</Typography>
      <Stack spacing={2}>
        {devices.length === 0 ? null : (
          devices.map(device => (
            <Box key={device.browserId} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">{device.name}</Typography>
              <AnimatedStatusChip
                key={device.heartbeat?.pulse ? 'pulse-on' : 'pulse-off'}
                label={device.isConnected ? 'Connected' : device.isConnecting ? 'Connecting...' : 'Disconnected'}
                color={device.isConnected ? 'success' : device.isConnecting ? 'warning' : 'default'}
                size="small"
                isActive={!!device.heartbeat?.isAlive}
                pulse={!!device.heartbeat?.pulse}
                icon={<FavoriteIcon fontSize="small" color={device.heartbeat?.isAlive ? 'error' : 'disabled'} />}
              />
              {device.isConnected ? (
                <Button size="small" variant="outlined" color="secondary" onClick={() => disconnectDevice(device.browserId)} disabled={device.isConnecting}>
                  Disconnect
                </Button>
              ) : (
                <Button size="small" variant="contained" color="primary" onClick={() => connectDevice(device.browserId)} disabled={device.isConnecting}>
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

// Selector hook: get a device by id, memoized
export function useDeviceById(deviceId: string) {
  const { devices } = useDeviceControllerContext();
  return React.useMemo(() => devices.find(d => d.browserId === deviceId), [devices, deviceId]);
}

/**
 * useHeartbeat - React hook to run a callback on every heartbeat for a device.
 * Usage: 
 *   const myCallback = React.useCallback(() => { ... }, []);
 *   useHeartbeat(deviceId, myCallback);
 *
 * Always use React.useCallback for the callback to avoid runaway subscriptions.
 */
export function useHeartbeat(deviceId: string | undefined, callback: () => void) {
  const { onHeartbeat } = useDeviceControllerContext();
  React.useEffect(() => {
    if (!deviceId) return;
    const unsubscribe = onHeartbeat(deviceId, callback);
    return unsubscribe;
  }, [deviceId, callback, onHeartbeat]);
}

/**
 * useConnect - React hook to get a stable connect callback for a device.
 * Usage:
 *   const connect = useConnect(deviceId);
 *   <Button onClick={connect}>Connect</Button>
 */
export function useConnect(deviceId: string | undefined) {
  const { connectDevice } = useDeviceControllerContext();
  return React.useCallback(() => {
    if (deviceId) connectDevice(deviceId);
  }, [deviceId, connectDevice]);
}

/**
 * useDisconnect - React hook to get a stable disconnect callback for a device.
 * Usage:
 *   const disconnect = useDisconnect(deviceId);
 *   <Button onClick={disconnect}>Disconnect</Button>
 */
export function useDisconnect(deviceId: string | undefined) {
  const { disconnectDevice } = useDeviceControllerContext();
  return React.useCallback(() => {
    if (deviceId) disconnectDevice(deviceId);
  }, [deviceId, disconnectDevice]);
} 