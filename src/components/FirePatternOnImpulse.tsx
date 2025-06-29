import { useEffect, useRef, useCallback } from 'react';
import { useImpulseEvents } from '../context/ImpulseEventContext';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';
import { fireSelectedPattern } from './PatternResponsePanel';
import { useAppStore } from '../store/appStore';

function useDebouncedCallback(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);
  return debouncedCallback;
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
    if (activeDeviceId) {
      const patternIndex = useAppStore.getState().patternResponseIndex;
      console.log('[FirePatternOnImpulse] Impulse received, firing pattern', patternIndex, 'on activeDeviceId:', activeDeviceId);
      fireSelectedPattern(patternIndex, devices, activeDeviceId);
    } else {
      console.log('[FirePatternOnImpulse] Impulse received, but no active deviceId to fire pattern on.');
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