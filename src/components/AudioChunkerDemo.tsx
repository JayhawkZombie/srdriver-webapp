import React, { useState, useRef } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Stack,
    Divider,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
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
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
        }
    };

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
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
        <Paper
            elevation={2}
            sx={{
                width: '100%',
                margin: '2rem 0',
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                minWidth: 320,
            }}
        >
            <Typography variant="h6" sx={{ mb: 1 }}>
                Audio Chunker Demo
            </Typography>
            <Box sx={{ mb: 1, p: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleFileButtonClick}
                    >
                        Choose File
                    </Button>
                    <Typography variant="body2" sx={{ ml: 1, minWidth: 120, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file ? file.name : 'No file chosen'}
                    </Typography>
                </Stack>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TextField
                    label="Window Size"
                    type="number"
                    size="small"
                    value={windowSize}
                    onChange={e => setWindowSize(Number(e.target.value))}
                    inputProps={{ min: 128, step: 128, style: { width: 80 } }}
                />
                <TextField
                    label="Hop Size"
                    type="number"
                    size="small"
                    value={hopSize}
                    onChange={e => setHopSize(Number(e.target.value))}
                    inputProps={{ min: 1, step: 1, style: { width: 80 } }}
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleProcess}
                    disabled={!file || loading}
                >
                    {loading ? 'Processing...' : 'Process Audio'}
                </Button>
            </Stack>
            {summary && (
                <Box sx={{ mt: 2, mb: 1, bgcolor: 'background.default', borderRadius: 1, p: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                        Chunking Summary
                    </Typography>
                    <List dense disablePadding>
                        <ListItem disableGutters>
                            <ListItemText primary={<><strong>Number of Chunks:</strong> {summary.numChunks}</>} />
                        </ListItem>
                        <ListItem disableGutters>
                            <ListItemText primary={<><strong>Chunk Duration:</strong> {summary.chunkDurationMs.toFixed(2)} ms</>} />
                        </ListItem>
                        <ListItem disableGutters>
                            <ListItemText primary={<><strong>Total Audio Duration:</strong> {summary.totalDurationMs.toFixed(2)} ms</>} />
                        </ListItem>
                        <ListItem disableGutters>
                            <ListItemText primary={<><strong>Window Size:</strong> {summary.windowSize} samples</>} />
                        </ListItem>
                        <ListItem disableGutters>
                            <ListItemText primary={<><strong>Hop Size:</strong> {summary.hopSize} samples</>} />
                        </ListItem>
                        {summary.firstChunkFFT && (
                            <ListItem disableGutters>
                                <ListItemText primary={<><strong>First Chunk FFT (first 8 bins):</strong> {summary.firstChunkFFT.map((v, i) => v.toFixed(2)).join(', ')}</>} />
                            </ListItem>
                        )}
                    </List>
                </Box>
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
        </Paper>
    );
};

export default AudioChunkerDemo;
