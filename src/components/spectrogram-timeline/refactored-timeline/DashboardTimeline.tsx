import React, { useState } from "react";
import styles from "./DashboardTimeline.module.css";
import { PlaybackProvider, usePlayback } from "./PlaybackContext";
import PlaybackControls from "./PlaybackControls";
import TimelineHeader from "./TimelineHeader";
import ResponseTimeline from "./ResponseTimeline";
import BarWaveform from "./BarWaveform";
import { useAppStore } from "../../../store/appStore";
import { selectWindowSec, selectDuration } from "../../../store/appStore";
import {
    decodeAudioFile,
    getMonoPCMData,
} from "../../../controllers/audioChunker";
import { workerManager } from "../../../controllers/workerManager";
import { useAsyncWorkerJob } from "../../dev/useAsyncWorkerJob";
import { ProgressBar, Button } from "@blueprintjs/core";

const AudioUpload: React.FC<{ onAudioBuffer: (audioBuffer: AudioBuffer) => void }> = ({ onAudioBuffer }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const setAudioData = useAppStore((s) => s.setAudioData);
    const { setAudioBuffer } = usePlayback();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAudioFile(file);
        if (file) {
            const audioBuffer = await decodeAudioFile(file);
            setAudioBuffer(audioBuffer);
            onAudioBuffer(audioBuffer);
            const pcm = getMonoPCMData(audioBuffer);
            setAudioData({ waveform: [], duration: audioBuffer.duration }); // Clear waveform for now
        }
    };

    return (
        <div className={styles.audioUpload}>
            <input type="file" accept="audio/*" onChange={handleFileChange} />
            {audioFile && (
                <div style={{ color: "#b8d4ff", fontSize: 13, marginTop: 8 }}>
                    Selected file: <strong>{audioFile.name}</strong>
                </div>
            )}
        </div>
    );
};

const WindowedWaveform: React.FC<{ waveform: number[]; width: number; height: number }> = ({ waveform, width, height }) => {
    const windowSec = useAppStore(selectWindowSec);
    const duration = useAppStore(selectDuration);
    // Assume windowSec is the window size in seconds, and timeline shows [windowStart, windowStart+windowSec]
    // For now, use windowStart = 0 (can be made reactive later)
    const windowStart = 0;
    const windowEnd = windowStart + windowSec;
    if (!waveform || waveform.length === 0 || !duration) return null;
    const startIdx = Math.floor((windowStart / duration) * waveform.length);
    const endIdx = Math.ceil((windowEnd / duration) * waveform.length);
    const windowedWaveform = waveform.slice(startIdx, endIdx);
    return <div className={styles.waveform}><BarWaveform width={width} height={height} waveform={windowedWaveform} /></div>;
};

export const DashboardTimeline: React.FC = () => {
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [waveform, setWaveform] = useState<number[]>([]);
    const { result, progress, loading, runJob } = useAsyncWorkerJob<{ waveform: number[] }, { processed: number; total: number }>();

    const handleAnalyze = async () => {
        if (!audioBuffer) return;
        const pcm = getMonoPCMData(audioBuffer);
        const req = {
            type: 'waveform' as const,
            pcmBuffer: pcm.buffer,
            sampleRate: audioBuffer.sampleRate,
            numPoints: 1000,
        };
        runJob((onProgress) =>
            workerManager.enqueueJob<typeof req, { waveform: number[] }>('waveform', req, onProgress)
        );
    };

    React.useEffect(() => {
        if (result && result.waveform) {
            setWaveform(result.waveform);
        }
    }, [result]);

    return (
        <PlaybackProvider>
            <div className={styles.root}>
                <div className={styles.header}>
                    <h2
                        style={{
                            color: "#b8d4ff",
                            fontWeight: 700,
                            fontSize: 24,
                            fontFamily:
                                "JetBrains Mono, Fira Mono, Menlo, monospace",
                            margin: 0,
                        }}
                    >
                        Dashboard Timeline
                    </h2>
                </div>
                <div className={styles.content}>
                    <AudioUpload onAudioBuffer={setAudioBuffer} />
                    <Button intent="primary" onClick={handleAnalyze} disabled={!audioBuffer || loading} style={{ marginBottom: 12 }}>
                        Analyze Audio
                    </Button>
                    <div className={styles.waveform} style={{ minHeight: 80 }}>
                        {loading ? (
                            <ProgressBar animate stripes value={progress && progress.total ? progress.processed / progress.total : 0} intent="primary" style={{ height: 12, borderRadius: 6 }} />
                        ) : (
                            <WindowedWaveform waveform={waveform} width={800} height={80} />
                        )}
                    </div>
                    <div className={styles.controls}>
                        <PlaybackControls />
                    </div>
                    <div className={styles.timeline}>
                        <TimelineHeader />
                        <ResponseTimeline />
                    </div>
                </div>
            </div>
        </PlaybackProvider>
    );
};

export default DashboardTimeline;
