import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { logWorkerMessage } from '../../../store/appLogger';
import type { DetectionDataContextValue, BandConfig, DetectionResult } from './DetectionDataTypes';

// Types moved to DetectionDataTypes.ts for Fast Refresh compliance

// Only export components at the bottom for Fast Refresh compliance
const DetectionDataContext = createContext<DetectionDataContextValue | undefined>(undefined);

const DetectionDataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [results, setResults] = useState<DetectionResult | null>(null);
  const [bandResults, setBandResults] = useState<DetectionResult[]>([]);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [bandProgress, setBandProgress] = useState<Array<{ processed: number; total: number } | null>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const value = useMemo(() => ({
    results,
    setResults,
    bandResults,
    setBandResults,
    progress,
    setProgress,
    bandProgress,
    setBandProgress,
    isLoading,
    setIsLoading,
    error,
    setError,
  }), [results, bandResults, progress, bandProgress, isLoading, error]);

  return (
    <DetectionDataContext.Provider value={value}>
      {children}
    </DetectionDataContext.Provider>
  );
};

function useDetectionData() {
  const ctx = useContext(DetectionDataContext);
  if (!ctx) throw new Error("useDetectionData must be used within a DetectionDataProvider");
  return ctx;
}

// Only export components here
export { DetectionDataProvider, useDetectionData }; 