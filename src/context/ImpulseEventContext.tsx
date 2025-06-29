import React, { createContext, useContext, useRef } from 'react';

export type ImpulseEvent = {
  strength: number;
  min: number;
  max: number;
  bandName?: string;
  time?: number;
};

export type ImpulseEventContextType = {
  subscribe: (cb: (event: ImpulseEvent) => void) => () => void;
  emit: (event: ImpulseEvent) => void;
};

const ImpulseEventContext = createContext<ImpulseEventContextType | undefined>(undefined);

export const ImpulseEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listeners = useRef<Set<(event: ImpulseEvent) => void>>(new Set());

  const subscribe = (cb: (event: ImpulseEvent) => void) => {
    listeners.current.add(cb);
    return () => listeners.current.delete(cb);
  };

  const emit = (event: ImpulseEvent) => {
    listeners.current.forEach(cb => cb(event));
  };

  return (
    <ImpulseEventContext.Provider value={{ subscribe, emit }}>
      {children}
    </ImpulseEventContext.Provider>
  );
};

export const useImpulseEvents = () => {
  const ctx = useContext(ImpulseEventContext);
  if (!ctx) throw new Error('useImpulseEvents must be used within ImpulseEventProvider');
  return ctx;
}; 