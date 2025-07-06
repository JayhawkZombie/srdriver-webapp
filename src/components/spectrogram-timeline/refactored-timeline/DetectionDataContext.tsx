import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { detectionEngines } from "../../../workers/detectionEngines";

// Types
export interface BandConfig {
  name: string;
  pcm: Float32Array;
  color: string;
}
export interface DetectionResult {
  detectionFunction: number[];
  times: number[];
  events: { time: number; strength?: number }[];
  error?: string;
}
export interface DetectionDataContextValue {
  results: DetectionResult | null;
  bandResults: DetectionResult[];
  progress: { processed: number; total: number } | null;
  bandProgress: Array<{ processed: number; total: number } | null>;
  isLoading: boolean;
  runDetection: () => void;
  error?: string;
}

const DetectionDataContext = createContext<DetectionDataContextValue | undefined>(undefined);

export const DetectionDataProvider: React.FC<{
  engine: string;
  pcm: Float32Array;
  sampleRate: number;
  bands?: BandConfig[];
  children: React.ReactNode;
}> = ({ engine, pcm, sampleRate, bands = [], children }) => {
  const [results, setResults] = useState<DetectionResult | null>(null);
  const [bandResults, setBandResults] = useState<DetectionResult[]>([]);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [bandProgress, setBandProgress] = useState<Array<{ processed: number; total: number } | null>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const runDetection = useCallback(() => {
    setIsLoading(true);
    setError(undefined);
    setResults(null);
    setBandResults([]);
    setProgress({ processed: 0, total: 1 });
    setBandProgress(bands.map(() => ({ processed: 0, total: 1 })));
    // PCM detection
    const worker = new Worker(new URL("../../../workers/detectionWorker.ts", import.meta.url), { type: "module" });
    worker.postMessage({ engine, pcm, sampleRate });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'progress') {
        setProgress({ processed: e.data.processed, total: e.data.total });
      } else if (e.data.type === 'done') {
        setResults(e.data.result);
        setIsLoading(false);
        worker.terminate();
      } else if (e.data.error) {
        setError(e.data.error);
        setIsLoading(false);
        worker.terminate();
      }
    };
    // Band detection
    bands.forEach((band, i) => {
      const bandWorker = new Worker(new URL("../../../workers/detectionWorker.ts", import.meta.url), { type: "module" });
      bandWorker.postMessage({ engine, pcm: band.pcm, sampleRate });
      bandWorker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'progress') {
          setBandProgress(prev => {
            const next = [...prev];
            next[i] = { processed: e.data.processed, total: e.data.total };
            return next;
          });
        } else if (e.data.type === 'done') {
          setBandResults(prev => {
            const next = [...prev];
            next[i] = e.data.result;
            return next;
          });
          bandWorker.terminate();
        } else if (e.data.error) {
          setError(e.data.error);
          bandWorker.terminate();
        }
      };
    });
  }, [engine, pcm, sampleRate, bands]);

  const value = useMemo(() => ({
    results,
    bandResults,
    progress,
    bandProgress,
    isLoading,
    runDetection,
    error,
  }), [results, bandResults, progress, bandProgress, isLoading, runDetection, error]);

  return (
    <DetectionDataContext.Provider value={value}>
      {children}
    </DetectionDataContext.Provider>
  );
};

export function useDetectionData() {
  const ctx = useContext(DetectionDataContext);
  if (!ctx) throw new Error("useDetectionData must be used within a DetectionDataProvider");
  return ctx;
} 