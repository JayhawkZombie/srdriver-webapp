import React from 'react';
import { usePulseTools } from '../controllers/PulseToolsContext';
import { Device } from '../types/Device';

function useImpulseHandler(
  showToast: (msg: string) => void,
  connectedDevices: Device[],
  activeDeviceId: string | null
) {
  const { values } = usePulseTools();
  const pulseInProgressRef = React.useRef(false);
  const lastPulseTimeRef = React.useRef(0);

  // Helper to normalize impulse strength to brightness (31-255)
  const normalizeStrengthToBrightness = (
    strength: number,
    min: number,
    max: number,
    maxBrightness: number
  ): number => {
    const BRIGHTNESS_MIN = 31;
    const BRIGHTNESS_MAX = maxBrightness;
    if (max === min) return Math.round((BRIGHTNESS_MIN + BRIGHTNESS_MAX) / 2);
    return Math.round(
      BRIGHTNESS_MIN +
        ((BRIGHTNESS_MAX - BRIGHTNESS_MIN) * (strength - min)) /
          (max - min)
    );
  };

  return React.useCallback(
    (
      strength: number,
      min: number,
      max: number,
      bandName?: string,
      time?: number
    ): void => {
      const { debounceMs, maxBrightness, easing, effect } = values.current;
      const now = Date.now();
      if (
        pulseInProgressRef.current ||
        now - lastPulseTimeRef.current < debounceMs
      )
        return;
      pulseInProgressRef.current = true;
      lastPulseTimeRef.current = now;

      // Easing logic: smooth the brightness
      let brightness = normalizeStrengthToBrightness(
        strength,
        min,
        max,
        maxBrightness
      );
      brightness = Math.round(brightness * (1 - easing) + min * easing);

      // Send to Arduino (if connected)
      const activeDevice = connectedDevices.find(
        (d: Device) => d.id === activeDeviceId
      );
      if (activeDevice && activeDevice.controller) {
        activeDevice.controller
          .pulseBrightness(brightness, 100)
          .finally(() => {
            setTimeout(() => {
              pulseInProgressRef.current = false;
            }, debounceMs);
          });
      } else {
        setTimeout(() => {
          pulseInProgressRef.current = false;
        }, debounceMs);
      }

      // Show a toast
      showToast(
        `Pulse: ${bandName ?? ''} @ ${time?.toFixed?.(2) ?? ''}s (strength: ${
          strength?.toFixed?.(1) ?? ''
        }) | Brightness: ${brightness} | Effect: ${effect}`
      );

      // TODO: Trigger effect, etc.
    },
    [values, connectedDevices, activeDeviceId, showToast]
  );
}

export function emitPulse({
  strength,
  min,
  max,
  bandName,
  time,
  tools,
  device,
  showToast,
  durationMs,
}: {
  strength: number;
  min: number;
  max: number;
  bandName?: string;
  time?: number;
  tools: ReturnType<typeof usePulseTools>['values']['current'];
  device?: Device;
  showToast: (msg: string) => void;
  durationMs?: number;
}) {
  // Helper to normalize impulse strength to brightness (31-255)
  const normalizeStrengthToBrightness = (
    strength: number,
    min: number,
    max: number,
    maxBrightness: number
  ): number => {
    const BRIGHTNESS_MIN = 31;
    const BRIGHTNESS_MAX = maxBrightness;
    if (max === min) return Math.round((BRIGHTNESS_MIN + BRIGHTNESS_MAX) / 2);
    return Math.round(
      BRIGHTNESS_MIN +
        ((BRIGHTNESS_MAX - BRIGHTNESS_MIN) * (strength - min)) /
          (max - min)
    );
  };

  const { debounceMs, maxBrightness, easing, effect } = tools;

  // Easing logic: smooth the brightness
  let brightness = normalizeStrengthToBrightness(
    strength,
    min,
    max,
    maxBrightness
  );
  brightness = Math.round(brightness * (1 - easing) + min * easing);

  // Send to Arduino (if connected)
  if (device && device.controller) {
    device.controller.pulseBrightness(brightness, durationMs ?? 500);
  }

  // Show a toast
  showToast(
    `Pulse: ${bandName ?? ''} @ ${time?.toFixed?.(2) ?? ''}s (strength: ${
      strength?.toFixed?.(1) ?? ''
    }) | Brightness: ${brightness} | Effect: ${effect}`
  );
  // TODO: Trigger effect, etc.
}

export default useImpulseHandler; 