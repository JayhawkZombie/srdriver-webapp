import React, { createContext, useContext } from "react";
import type { BandConfig } from "./DetectionDataContext";

export type BandData = {
    band: { name: string; color: string };
    bandIdx: number;
    binIdx: number;
    magnitudes: number[];
    derivatives: number[];
    secondDerivatives: number[];
    impulseStrengths: number[];
    normalizedImpulseStrengths: number[];
    detectionFunction?: number[];
    threshold?: number[];
    sustainedImpulses?: number[];
    detectionTimes?: number[];
};

export type AudioAnalysisContextType = {
    pcm: Float32Array | null;
    sampleRate: number | null;
    localWaveform: number[] | null;
    localDuration: number | null;
    bandConfigs: BandConfig[];
    setBandConfigs: React.Dispatch<React.SetStateAction<BandConfig[]>>;
    filtering: boolean;
    setFiltering: React.Dispatch<React.SetStateAction<boolean>>;
    selectedEngine: string;
    setSelectedEngine: React.Dispatch<React.SetStateAction<string>>;
    engineOptions: string[];
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    progress: { processed: number; total: number; jobId?: string } | null;
    bandDataArr: BandData[];
    plotReady: boolean;
    setPlotReady: (ready: boolean) => void;
};

export const AudioAnalysisContext = createContext<AudioAnalysisContextType | null>(null);

export function useAudioAnalysis() {
    const ctx = useContext(AudioAnalysisContext);
    if (!ctx) throw new Error("useAudioAnalysis must be used within AudioAnalysisProvider");
    return ctx;
}

export type AudioAnalysisProviderProps = { children: React.ReactNode };

export function isWaveformResult(result: unknown): result is { waveform: number[]; duration: number; type: string } {
    return (
        typeof result === 'object' &&
        result !== null &&
        'type' in result &&
        (result as { type: string }).type === 'waveformResult' &&
        Array.isArray((result as { waveform?: unknown }).waveform)
    );
} 