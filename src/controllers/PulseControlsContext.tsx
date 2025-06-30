import React, { createContext, useContext, useRef, useCallback, useState } from 'react';
import debounce from 'lodash/debounce';

export interface PulseControls {
  sensitivity: number;
  width: number;
  interval: number;
}

interface PulseControlsContextType extends PulseControls {
  setControls: (c: Partial<PulseControls>) => void;
}

const PulseControlsContext = createContext<PulseControlsContextType | undefined>(undefined);

export const PulseControlsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [controls, setControlsState] = useState<PulseControls>({
    sensitivity: 0.5,
    width: 100,
    interval: 100,
  });

  // Debounced setter to avoid rapid updates
  const debouncedSetControls = useRef(
    debounce((c: Partial<PulseControls>) => {
      setControlsState(prev => ({ ...prev, ...c }));
    }, 300)
  ).current;

  const setControls = useCallback((c: Partial<PulseControls>) => {
    debouncedSetControls(c);
  }, [debouncedSetControls]);

  return (
    <PulseControlsContext.Provider value={{ ...controls, setControls }}>
      {children}
    </PulseControlsContext.Provider>
  );
};

export function usePulseControls() {
  const ctx = useContext(PulseControlsContext);
  if (!ctx) throw new Error('usePulseControls must be used within a PulseControlsProvider');
  return ctx;
} 