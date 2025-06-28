import React, { createContext, useContext, useState, useCallback } from 'react';

export interface PulseEvent {
  bandName: string;
  time: number;
  strength: number;
}

interface PulseContextType {
  emitPulse: (pulse: PulseEvent) => void;
  latestPulse: PulseEvent | null;
  latestPulseTimestamp: number | null;
}

const PulseContext = createContext<PulseContextType | undefined>(undefined);

export const PulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latestPulse, setLatestPulse] = useState<PulseEvent | null>(null);
  const [latestPulseTimestamp, setLatestPulseTimestamp] = useState<number | null>(null);

  const emitPulse = useCallback((pulse: PulseEvent) => {
    setLatestPulse(pulse);
    setLatestPulseTimestamp(Date.now());
  }, []);

  return (
    <PulseContext.Provider value={{ emitPulse, latestPulse, latestPulseTimestamp }}>
      {children}
    </PulseContext.Provider>
  );
};

export function usePulseContext() {
  const ctx = useContext(PulseContext);
  if (!ctx) throw new Error('usePulseContext must be used within a PulseProvider');
  return ctx;
} 