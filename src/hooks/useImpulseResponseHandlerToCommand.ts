import { useEffect } from 'react';
import { useImpulseEvents } from '../context/ImpulseEventContext';
import { useAppStore } from '../store/appStore';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';

export function useImpulseResponseHandlerToCommand() {
    const { subscribe } = useImpulseEvents();
    const impulseResponseAction = useAppStore(
        (state) => state.impulseResponseAction
    );
    const impulseResponseArgs = useAppStore(
        (state) => state.impulseResponseArgs
    );
    const activeDeviceId = useAppStore((state) => state.activeDeviceId);
    const { devices } = useDeviceControllerContext();

    useEffect(() => {
        const unsubscribe = subscribe((event) => {
            console.log('[ImpulseHandler] Event:', event, { activeDeviceId, impulseResponseAction, impulseResponseArgs });
            const device = devices.find(
                (d) => d.id === activeDeviceId && d.isConnected
            );
            if (device && device.controller) {
                device.controller.sendCommand(
                    `${impulseResponseAction}:${impulseResponseArgs}`
                );
            } else {
                console.warn('[ImpulseHandler] No connected device or activeDeviceId. Impulse event received but no command sent.', { activeDeviceId, devices });
            }
        });
        return unsubscribe;
    }, [
        subscribe,
        impulseResponseAction,
        impulseResponseArgs,
        activeDeviceId,
        devices,
    ]);
} 