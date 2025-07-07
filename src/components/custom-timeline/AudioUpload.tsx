import React, { useState } from "react";
import { useAppStore } from "../../store/appStore";
import { usePlayback } from "./PlaybackContext";
import { decodeAudioFile, getMonoPCMData } from "../../controllers/audioChunker";
import { workerManager } from "../../controllers/workerManager";
import styles from "./TimelineHeader.module.css";

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
            const req = {
                type: 'waveform' as const,
                pcmBuffer: pcm.buffer,
                sampleRate: audioBuffer.sampleRate,
                numPoints: 1000,
            };
            const result = await workerManager.enqueueJob<typeof req, { type: string; waveform?: number[] }>('waveform', req);
            console.log("Worker result:", result);
            if (result && result.type === 'waveformResult' && Array.isArray(result.waveform)) {
                setAudioData({ waveform: result.waveform, duration: audioBuffer.duration });
            } else {
                console.error("No waveform returned from worker!", result);
            }
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

export default AudioUpload; 