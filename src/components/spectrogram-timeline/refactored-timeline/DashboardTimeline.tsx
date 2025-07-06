import React, { useState } from "react";
import styles from "./DashboardTimeline.module.css";
import { PlaybackProvider, usePlayback } from "./PlaybackContext";
import PlaybackControls from "./PlaybackControls";
import TimelineHeader from "./TimelineHeader";
import ResponseTimeline from "./ResponseTimeline";
import Waveform from "./Waveform";
import { useAppStore } from "../../../store/appStore";
import { selectWaveform } from "../../../store/selectors";
import {
    decodeAudioFile,
    getMonoPCMData,
} from "../../../controllers/audioChunker";

function downsamplePCM(pcm: Float32Array, numPoints: number): number[] {
    const len = pcm.length;
    const result = [];
    for (let i = 0; i < numPoints; i++) {
        const start = Math.floor((i / numPoints) * len);
        const end = Math.floor(((i + 1) / numPoints) * len);
        let min = 1,
            max = -1;
        for (let j = start; j < end; j++) {
            const v = pcm[j] || 0;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        result.push((min + max) / 2);
    }
    return result;
}

const AudioUpload: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const setAudioData = useAppStore((s) => s.setAudioData);
    const { setAudioBuffer } = usePlayback();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAudioFile(file);
        if (file) {
            const audioBuffer = await decodeAudioFile(file);
            setAudioBuffer(audioBuffer);
            const pcm = getMonoPCMData(audioBuffer);
            const waveform = downsamplePCM(pcm, 1000);
            setAudioData({ waveform, duration: audioBuffer.duration });
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

const WaveformWithStore = (props: { width: number; height: number }) => {
    const waveform = useAppStore(selectWaveform);
    if (!Array.isArray(waveform) || waveform.length === 0) return null;
    return (
        <div className={styles.waveform}>
            <Waveform width={props.width} height={props.height} />
        </div>
    );
};

export const DashboardTimeline: React.FC = () => {
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
                    <AudioUpload />
                    <WaveformWithStore width={800} height={80} />
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
