import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ImpulseResponseContextType {
  lastPulse: any;
  firePulse: (data: any) => void;
}

const ImpulseResponseContext = createContext<ImpulseResponseContextType | undefined>(undefined);

export const useImpulseResponse = () => {
  const ctx = useContext(ImpulseResponseContext);
  if (!ctx) throw new Error('useImpulseResponse must be used within ImpulseResponseProvider');
  return ctx;
};

export const ImpulseResponseProvider = ({ children }: { children: ReactNode }) => {
  const [lastPulse, setLastPulse] = useState<any>(null);

  const firePulse = (data: any) => setLastPulse(data);

  return (
    <ImpulseResponseContext.Provider value={{ lastPulse, firePulse }}>
      {children}
    </ImpulseResponseContext.Provider>
  );
}; 