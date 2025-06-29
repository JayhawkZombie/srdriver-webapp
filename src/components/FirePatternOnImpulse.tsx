import { useEffect, useRef } from 'react';
import { useImpulseEvents } from '../context/ImpulseEventContext';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { fireSelectedPattern } from './PatternResponsePanel';
import { useAppStore } from '../store/appStore';

function useDebouncedCallback(callback: (...args: any[]) => void, delay: number) {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  return (...args: any[]) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => callback(...args), delay);
  };
}

const FirePatternOnImpulse: React.FC = () => {
  const { subscribe } = useImpulseEvents();
  const { devices } = useDeviceControllerContext();
  const activeDeviceId = useAppStore(state => state.activeDeviceId);
  const activeDeviceRef = useRef(devices.find(d => d.id === activeDeviceId && d.isConnected) || null);

  // Keep ref up to date
  useEffect(() => {
    activeDeviceRef.current = devices.find(d => d.id === activeDeviceId && d.isConnected) || null;
  }, [devices, activeDeviceId]);

  // Debounced fire
  const debouncedFire = useDebouncedCallback(() => {
    if (activeDeviceRef.current) {
      console.log('[FirePatternOnImpulse] Impulse received, firing pattern 11 on device:', activeDeviceRef.current);
      fireSelectedPattern(11, activeDeviceRef.current);
    } else {
      console.log('[FirePatternOnImpulse] Impulse received, but no active device to fire pattern on.');
    }
  }, 200);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      debouncedFire();
    });
    return unsubscribe;
  }, [subscribe, debouncedFire]);

  return null;
};

export default FirePatternOnImpulse; 