import React, { useState, useRef, useEffect } from "react";
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
    ListItemText,
    CircularProgress,
    Skeleton,
    LinearProgress
} from '@mui/material';
import {
    decodeAudioFile,
    getMonoPCMData,
    chunkPCMData,
} from "../controllers/audioChunker";
import { computeFFTMagnitude } from "../controllers/fftUtils";
import Plot from 'react-plotly.js';
import AudioFrequencyVisualizer from './AudioFrequencyVisualizer';
import WaveSurfer from "wavesurfer.js";
// Import worker (Vite/CRA style)
// @ts-ignore
import audioWorkerUrl from '../controllers/audioWorker.ts?worker';

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
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
    const waveformRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const audioWorkerRef = useRef<Worker | null>(null);
    const [processingProgress, setProcessingProgress] = useState<{ processed: number, total: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
            setAudioUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Set up the worker and cleanup
    useEffect(() => {
        // @ts-ignore
        audioWorkerRef.current = new Worker(new URL('../controllers/audioWorker.ts', import.meta.url));
        audioWorkerRef.current.onmessage = (e) => {
            const { type, processed, total, summary, fftSequence } = e.data;
            if (type === 'progress') {
                setProcessingProgress({ processed, total });
            } else if (type === 'done') {
                setSummary(summary);
                setFftSequence(fftSequence);
                setLoading(false);
                setProcessingProgress(null);
            }
        };
        return () => {
            audioWorkerRef.current?.terminate();
        };
    }, []);

    const handleProcess = async () => {
        if (!file) return;
        setLoading(true);
        setFftSequence([]); // Reset sequence
        setProcessingProgress(null); // Reset progress
        try {
            // Decode in main thread, send PCM to worker
            const audioBuffer = await decodeAudioFile(file);
            audioBufferRef.current = audioBuffer;
            const pcmData = getMonoPCMData(audioBuffer);
            audioWorkerRef.current?.postMessage({
                pcmBuffer: pcmData.buffer,
                windowSize,
                hopSize,
            });
        } catch (err) {
            alert("Error decoding audio file.");
            setLoading(false);
            setProcessingProgress(null);
        }
    };

    useEffect(() => {
        if (!audioUrl || !waveformRef.current) return;
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }
        wavesurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: "#90caf9",
            progressColor: "#1976d2",
            height: 100,
            barWidth: 2,
            cursorColor: "#f50057",
        });
        wavesurferRef.current.load(audioUrl);
        wavesurferRef.current.on('finish', () => setIsPlaying(false));
        // Listen to playback position
        wavesurferRef.current.on('audioprocess', (time: number) => {
            setPlaybackTime(time);
        });
        wavesurferRef.current.on('interaction', () => {
            setPlaybackTime(wavesurferRef.current?.getCurrentTime() || 0);
        });
        return () => {
            wavesurferRef.current?.destroy();
        };
    }, [audioUrl]);

    const handlePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
            setIsPlaying(wavesurferRef.current.isPlaying());
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
            {audioUrl && (
                <Box sx={{ mt: 2 }}>
                    <div ref={waveformRef} />
                    <Button
                        variant="contained"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={handlePlayPause}
                        disabled={!audioUrl}
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                </Box>
            )}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, mt: 2 }}>
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
            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 120, my: 2, width: '100%' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2, mb: 2 }}>Processing audio...</Typography>
                    {processingProgress && (
                        <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={100 * processingProgress.processed / processingProgress.total}
                            />
                            <Typography variant="caption" sx={{ mt: 1 }}>
                                {`Processed ${processingProgress.processed} of ${processingProgress.total} chunks`}
                            </Typography>
                        </Box>
                    )}
                    {/* Skeletons for plot cards */}
                    <Box sx={{ width: '100%', maxWidth: 700 }}>
                        {[0,1,2,3,4].map(i => (
                            <Box key={i} sx={{ mb: 2 }}>
                                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 1 }} />
                                <Skeleton variant="text" width="40%" />
                                <Skeleton variant="text" width="60%" />
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
            {!loading && fftSequence.length > 0 && audioBufferRef.current && (
                <AudioFrequencyVisualizer
                    fftSequence={fftSequence}
                    sampleRate={audioBufferRef.current.sampleRate}
                    windowSize={windowSize}
                    hopSize={hopSize}
                    audioBuffer={audioBufferRef.current}
                    playbackTime={playbackTime}
                />
            )}
        </Paper>
    );
};

export default AudioChunkerDemo;
