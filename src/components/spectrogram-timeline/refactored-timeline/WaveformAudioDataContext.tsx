import React, { createContext, useContext, useMemo } from "react";

export type FakeAudioType = "sine" | "random" | "beat" | "screenshot";

export interface WaveformAudioDataContextValue {
  barData: number[];
  waveformData: number[];
  type: FakeAudioType;
}

const WaveformAudioDataContext = createContext<WaveformAudioDataContextValue | undefined>(undefined);

export interface FakeAudioDataProviderProps {
  type?: FakeAudioType;
  length?: number;
  children: React.ReactNode;
}

function generateFakeData(type: FakeAudioType, length: number): { barData: number[]; waveformData: number[] } {
  if (type === "sine") {
    const data = Array.from({ length }, (_, i) => Math.sin((i / length) * 4 * Math.PI));
    return { barData: data.map(x => Math.abs(x)), waveformData: data };
  }
  if (type === "random") {
    const data = Array.from({ length }, () => Math.random() * 2 - 1);
    return { barData: data.map(x => Math.abs(x)), waveformData: data };
  }
  if (type === "beat") {
    const data = Array.from({ length }, (_, i) => (i % 32 < 4 ? 1 : Math.random() * 0.4));
    return { barData: data, waveformData: data.map(x => x * 2 - 1) };
  }
  // screenshot-like
  const N = length;
  const screenshotLikeData = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    let env = 1;
    if (t < 0.1) env = t / 0.1;
    else if (t > 0.9) env = (1 - t) / 0.1;
    const beat = Math.sin(2 * Math.PI * t * 8) * 0.2 + 0.8;
    const noise = 0.85 + Math.random() * 0.15;
    return Math.max(0, Math.min(1, env * beat * noise));
  });
  return { barData: screenshotLikeData, waveformData: screenshotLikeData.map(x => x * 2 - 1) };
}

export const FakeAudioDataProvider: React.FC<FakeAudioDataProviderProps> = ({ type = "screenshot", length = 400, children }) => {
  const value = useMemo(() => {
    const { barData, waveformData } = generateFakeData(type, length);
    return { barData, waveformData, type };
  }, [type, length]);
  return (
    <WaveformAudioDataContext.Provider value={value}>
      {children}
    </WaveformAudioDataContext.Provider>
  );
};

export function useWaveformAudioData() {
  const ctx = useContext(WaveformAudioDataContext);
  if (!ctx) throw new Error("useWaveformAudioData must be used within a FakeAudioDataProvider");
  return ctx;
} 