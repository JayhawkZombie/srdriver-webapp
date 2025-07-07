import React, { useState, useCallback, useMemo } from "react";
import { useAppStore } from "../../../store/appStore";
import { workerManager } from "../../../controllers/workerManager";
import { decodeAudioFile, getMonoPCMData } from "../../../controllers/audioChunker";
import { detectionEngines } from "../../../workers/detectionEngines";
import type { BandConfig } from "./DetectionDataContext";
import {
    AudioAnalysisContext,
    type AudioAnalysisContextType,
    type AudioAnalysisProviderProps,
    isWaveformResult
} from "./AudioAnalysisContextHelpers";

// BandData type (inline, matching worker output)
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

function AudioAnalysisProvider({ children }: AudioAnalysisProviderProps) {
    const setAudioData = useAppStore((s) => s.setAudioData);
    const setWaveformProgress = useAppStore((s) => s.setWaveformProgress);
    const progress = useAppStore((s) => s.waveformProgress);
    const bandDataArr = useAppStore((s) => s.audio.analysis?.bandDataArr) || [];
    const engineOptions = Object.keys(detectionEngines);
    const [pcm, setPcm] = useState<Float32Array | null>(null);
    const [sampleRate, setSampleRate] = useState<number | null>(null);
    const [localWaveform, setLocalWaveform] = useState<number[] | null>(null);
    const [localDuration, setLocalDuration] = useState<number | null>(null);
    const [selectedEngine, setSelectedEngine] = useState<string>(engineOptions[0]);
    const [bandConfigs, setBandConfigs] = useState<BandConfig[]>([]);
    const [filtering, setFiltering] = useState<boolean>(false);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        const audioBuffer = await decodeAudioFile(file);
        const pcmData = getMonoPCMData(audioBuffer);
        setPcm(pcmData);
        setSampleRate(audioBuffer.sampleRate);
        setWaveformProgress({ processed: 0, total: 1000 });
        workerManager
            .enqueueJob(
                "waveform",
                {
                    type: "waveform",
                    pcmBuffer: pcmData.buffer,
                    sampleRate: audioBuffer.sampleRate,
                    numPoints: 1000,
                },
                (progress) => setWaveformProgress(progress)
            )
            .then((result) => {
                if (isWaveformResult(result)) {
                    setLocalWaveform(result.waveform);
                    setLocalDuration(audioBuffer.duration);
                    setAudioData({
                        waveform: result.waveform.slice(0, 1000),
                        duration: audioBuffer.duration,
                    });
                    setWaveformProgress(null);
                }
            });
    }, [setAudioData, setWaveformProgress]);

    const value: AudioAnalysisContextType = useMemo(() => ({
        pcm,
        sampleRate,
        localWaveform,
        localDuration,
        bandConfigs,
        setBandConfigs,
        filtering,
        setFiltering,
        selectedEngine,
        setSelectedEngine,
        engineOptions,
        handleFileChange,
        progress,
        bandDataArr,
    }), [pcm, sampleRate, localWaveform, localDuration, bandConfigs, filtering, selectedEngine, engineOptions, handleFileChange, progress, bandDataArr]);

    return (
        <AudioAnalysisContext.Provider value={value}>
            {children}
        </AudioAnalysisContext.Provider>
    );
}

export { AudioAnalysisProvider }; 