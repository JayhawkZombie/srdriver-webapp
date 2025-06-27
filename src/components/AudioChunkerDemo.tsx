import React, { useState, useRef } from "react";
import {
    decodeAudioFile,
    getMonoPCMData,
    chunkPCMData,
} from "../controllers/audioChunker";
import { computeFFTMagnitude } from "../controllers/fftUtils";
import Plot from 'react-plotly.js';
import AudioFrequencyVisualizer from './AudioFrequencyVisualizer';

interface ChunkSummary {
    numChunks: number;
    chunkDurationMs: number;
    totalDurationMs: number;
    windowSize: number;
    hopSize: number;
    firstChunkFFT?: number[];
    firstChunkFFTMagnitudes?: Float32Array;
}

const DEFAULT_WINDOW_SIZE = 1024;
const DEFAULT_HOP_SIZE = 512;

const AudioChunkerDemo: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [windowSize, setWindowSize] = useState<number>(DEFAULT_WINDOW_SIZE);
    const [hopSize, setHopSize] = useState<number>(DEFAULT_HOP_SIZE);
    const [summary, setSummary] = useState<ChunkSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const [fftSequence, setFftSequence] = useState<(Float32Array | number[])[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setLoading(true);
        setFftSequence([]); // Reset sequence
        try {
            const audioBuffer = await decodeAudioFile(file);
            audioBufferRef.current = audioBuffer;
            const sampleRate = audioBuffer.sampleRate;
            const pcmData = getMonoPCMData(audioBuffer);
            let numChunks = 0;
            let firstChunk: Float32Array | null = null;
            let fftSeq: (Float32Array | number[])[] = [];
            const chunks = Array.from(chunkPCMData(pcmData, windowSize, hopSize));
            for (let idx = 0; idx < chunks.length; idx++) {
                const chunk = chunks[idx];
                numChunks++;
                if (idx === 0) firstChunk = chunk;
                const magnitudes = computeFFTMagnitude(chunk);
                fftSeq.push(magnitudes);
            }
            setFftSequence(fftSeq);
            const chunkDurationMs = (windowSize / sampleRate) * 1000;
            const totalDurationMs = (pcmData.length / sampleRate) * 1000;
            let firstChunkFFT: number[] | undefined = undefined;
            let firstChunkFFTMagnitudes: Float32Array | undefined = undefined;
            if (firstChunk) {
                const magnitudes = computeFFTMagnitude(firstChunk);
                firstChunkFFTMagnitudes = magnitudes;
                firstChunkFFT = Array.from(magnitudes.slice(0, 8));
            }
            setSummary({
                numChunks: chunks.length,
                chunkDurationMs,
                totalDurationMs,
                windowSize,
                hopSize,
                firstChunkFFT,
                firstChunkFFTMagnitudes,
            });
        } catch (err) {
            alert("Error decoding audio file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: 700,
                margin: "2rem auto",
                padding: "1rem",
                border: "1px solid #ccc",
                borderRadius: 8,
            }}
        >
            <h2>Audio Chunker Demo</h2>
            <div style={{ marginBottom: 16 }}>
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                />
            </div>
            <div style={{ marginBottom: 16 }}>
                <label>
                    Window Size:
                    <input
                        type="number"
                        min={128}
                        step={128}
                        value={windowSize}
                        onChange={(e) => setWindowSize(Number(e.target.value))}
                        style={{ marginLeft: 8, width: 80 }}
                    />
                </label>
                <label style={{ marginLeft: 16 }}>
                    Hop Size:
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={hopSize}
                        onChange={(e) => setHopSize(Number(e.target.value))}
                        style={{ marginLeft: 8, width: 80 }}
                    />
                </label>
            </div>
            <button onClick={handleProcess} disabled={!file || loading}>
                {loading ? "Processing..." : "Process Audio"}
            </button>
            {summary && (
                <div style={{ marginTop: 24 }}>
                    <h3>Chunking Summary</h3>
                    <ul>
                        <li>
                            <strong>Number of Chunks:</strong>{' '}
                            {summary.numChunks}
                        </li>
                        <li>
                            <strong>Chunk Duration:</strong>{' '}
                            {summary.chunkDurationMs.toFixed(2)} ms
                        </li>
                        <li>
                            <strong>Total Audio Duration:</strong>{' '}
                            {summary.totalDurationMs.toFixed(2)} ms
                        </li>
                        <li>
                            <strong>Window Size:</strong> {summary.windowSize}{' '}
                            samples
                        </li>
                        <li>
                            <strong>Hop Size:</strong> {summary.hopSize} samples
                        </li>
                        {summary.firstChunkFFT && (
                            <li>
                                <strong>First Chunk FFT (first 8 bins):</strong>{' '}
                                {summary.firstChunkFFT.map((v, i) => v.toFixed(2)).join(', ')}
                            </li>
                        )}
                    </ul>
                </div>
            )}
            {fftSequence.length > 0 && audioBufferRef.current && (
                <AudioFrequencyVisualizer
                    fftSequence={fftSequence}
                    sampleRate={audioBufferRef.current.sampleRate}
                    windowSize={windowSize}
                    hopSize={hopSize}
                    audioBuffer={audioBufferRef.current}
                />
            )}
        </div>
    );
};

export default AudioChunkerDemo;
