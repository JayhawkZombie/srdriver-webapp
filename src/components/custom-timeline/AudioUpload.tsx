import React, { useState, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { usePlaybackController } from "./PlaybackContext";
import { decodeAudioFile, getMonoPCMData } from "../../controllers/audioChunker";
import { workerManager } from "../../controllers/workerManager";
import styles from "./TimelineHeader.module.css";

const AudioUpload: React.FC<{ onAudioBuffer: (audioBuffer: AudioBuffer) => void }> = ({ onAudioBuffer }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const setAudioData = useAppStore((s) => s.setAudioData);
    const { setBuffer } = usePlaybackController();
    const currentJobId = useRef(0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAudioFile(file);
        setError(null);
        setProgress(null);
        if (file) {
            const jobId = ++currentJobId.current;
            try {
                const audioBuffer = await decodeAudioFile(file);
                setBuffer(audioBuffer);
                onAudioBuffer(audioBuffer);
                const pcm = getMonoPCMData(audioBuffer);
                const req = {
                    type: 'waveform' as const,
                    pcmBuffer: pcm.buffer,
                    sampleRate: audioBuffer.sampleRate,
                    numPoints: 1000,
                };
                const result = await workerManager.enqueueJob<typeof req, { type: string; waveform?: number[] }>(
                    'waveform',
                    req,
                    (prog) => {
                        // Only update progress if this is the latest job
                        if (currentJobId.current === jobId) setProgress(prog);
                    }
                );
                if (currentJobId.current !== jobId) return; // Ignore old jobs
                if (result && result.type === 'waveformResult' && Array.isArray(result.waveform)) {
                    setAudioData({ waveform: result.waveform, duration: audioBuffer.duration });
                } else {
                    setError("No waveform returned from worker!");
                    console.error("No waveform returned from worker!", result);
                }
            } catch (err: unknown) {
                if (currentJobId.current === jobId) {
                    if (err && typeof err === 'object' && 'message' in err) {
                        setError((err as { message: string }).message);
                    } else {
                        setError(String(err));
                    }
                }
            } finally {
                if (currentJobId.current === jobId) setProgress(null);
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
            {progress && progress.total > 0 && progress.processed < progress.total && (
                <div style={{ marginTop: 8 }}>
                    <div style={{ background: '#222', borderRadius: 4, height: 8, width: 200, overflow: 'hidden' }}>
                        <div style={{ background: '#4fc3f7', height: '100%', width: `${(progress.processed / progress.total) * 100}%` }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#b8d4ff', marginTop: 2 }}>
                        Generating waveform... {progress.processed} / {progress.total}
                    </div>
                </div>
            )}
            {error && (
                <div style={{ color: 'red', fontSize: 13, marginTop: 8 }}>{error}</div>
            )}
        </div>
    );
};

export default AudioUpload; 