import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

export interface PulseToolsValues {
  debounceMs: number;
  maxBrightness: number;
  easing: number;
  effect: string;
}

interface PulseToolsContextType {
  values: React.MutableRefObject<PulseToolsValues>;
  setDebounceMs: (v: number) => void;
  setMaxBrightness: (v: number) => void;
  setEasing: (v: number) => void;
  setEffect: (v: string) => void;
  forceUpdate: () => void;
}

const DEFAULTS: PulseToolsValues = {
  debounceMs: 200,
  maxBrightness: 90,
  easing: 0.3,
  effect: '',
};

const PulseToolsContext = createContext<PulseToolsContextType | undefined>(undefined);

export const PulseToolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const values = useRef<PulseToolsValues>({ ...DEFAULTS });
  // Dummy state to force UI update when needed
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const setDebounceMs = useCallback((v: number) => {
    values.current.debounceMs = v;
    forceUpdate();
  }, [forceUpdate]);
  const setMaxBrightness = useCallback((v: number) => {
    values.current.maxBrightness = v;
    forceUpdate();
  }, [forceUpdate]);
  const setEasing = useCallback((v: number) => {
    values.current.easing = v;
    forceUpdate();
  }, [forceUpdate]);
  const setEffect = useCallback((v: string) => {
    values.current.effect = v;
    forceUpdate();
  }, [forceUpdate]);

  return (
    <PulseToolsContext.Provider value={{ values, setDebounceMs, setMaxBrightness, setEasing, setEffect, forceUpdate }}>
      {children}
    </PulseToolsContext.Provider>
  );
};

export function usePulseTools() {
  const ctx = useContext(PulseToolsContext);
  if (!ctx) throw new Error('usePulseTools must be used within a PulseToolsProvider');
  return ctx;
} 