import React, { useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAppStore } from '../store/appStore';
import { decodeAudioFile, getMonoPCMData } from '../controllers/audioChunker';

const BAND_DEFINITIONS = [
  { name: 'Bass', freq: 60, color: 'blue' },
  { name: 'Low Mid', freq: 250, color: 'green' },
  { name: 'Mid', freq: 1000, color: 'orange' },
  { name: 'Treble', freq: 4000, color: 'red' },
  { name: 'High Treble', freq: 8000, color: 'purple' },
];

const AudioFileControls: React.FC = () => {
  const file = useAppStore(state => state.file);
  const setFile = useAppStore(state => state.setFile);
  const setAudioData = useAppStore(state => state.setAudioData);
  const setAudioUrl = useAppStore(state => state.setAudioUrl);
  const loading = useAppStore(state => state.loading);
  const setLoading = useAppStore(state => state.setLoading);
  const setProcessingProgress = useAppStore(state => state.setProcessingProgress);
  const selectedEngine = useAppStore(state => state.selectedEngine);
  const windowSize = useAppStore(state => state.windowSize);
  const hopSize = useAppStore(state => state.hopSize);
  const impulseWindowSize = useAppStore(state => state.impulseWindowSize);
  const impulseSmoothing = useAppStore(state => state.impulseSmoothing);
  const impulseDetectionMode = useAppStore(state => state.impulseDetectionMode);
  const derivativeMode = useAppStore(state => state.derivativeMode || 'centered');
  const spectralFluxWindow = useAppStore(state => state.spectralFluxWindow);
  const spectralFluxK = useAppStore(state => state.spectralFluxK);
  const spectralFluxMinSeparation = useAppStore(state => state.spectralFluxMinSeparation);
  const minDb = useAppStore(state => state.minDb);
  const minDbDelta = useAppStore(state => state.minDbDelta);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioWorkerRef = useRef<Worker | null>(null);
  const visualizationWorkerRef = useRef<Worker | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const lastProcessedSettings = useRef<Partial<Record<string, unknown>> | null>(null);
  const highestProgressRef = useRef(0);
  const currentJobIdRef = useRef('');

  React.useEffect(() => {
    audioWorkerRef.current = new Worker(new URL('../workers/audioWorker.ts', import.meta.url), { type: 'module' });
    visualizationWorkerRef.current = new Worker(new URL('../controllers/visualizationWorker.ts', import.meta.url), { type: 'module' });
    return () => {
      audioWorkerRef.current?.terminate();
      visualizationWorkerRef.current?.terminate();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAudioData({ analysis: null, metadata: null });
      setAudioUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setProcessingProgress({ processed: 0, total: 1 });
    setAudioData({ analysis: null });
    try {
      // Generate a unique jobId for this processing run
      const jobId = Date.now().toString() + Math.random().toString(36).slice(2);
      currentJobIdRef.current = jobId;
      highestProgressRef.current = 0;
      // Decode in main thread, send PCM to worker
      const audioBuffer = await decodeAudioFile(file);
      audioBufferRef.current = audioBuffer;
      setAudioData({ analysis: {
        fftSequence: [],
        summary: null,
        audioBuffer
      }});
      const pcmData = getMonoPCMData(audioBuffer);
      // Send to detection worker with selected engine and jobId
      audioWorkerRef.current!.onmessage = (e: MessageEvent) => {
        const { type, processed, total, summary, fftSequence, detectionFunction, times, jobId: msgJobId } = e.data;
        if (type === 'progress') {
          if (msgJobId === currentJobIdRef.current && processed >= highestProgressRef.current) {
            highestProgressRef.current = processed;
            setProcessingProgress({ processed, total });
          }
        } else if (type === 'done') {
          if (msgJobId === currentJobIdRef.current) {
            highestProgressRef.current = 0;
            currentJobIdRef.current = '';
            const audioBuffer = audioBufferRef.current;
            let newSummary = summary;
            if (audioBuffer && summary) {
              newSummary = { ...summary, totalDurationMs: audioBuffer.duration * 1000 };
            }
            // After audio worker is done, call visualization worker
            if (visualizationWorkerRef.current && fftSequence && fftSequence.length > 0) {
              visualizationWorkerRef.current.onmessage = (ve: MessageEvent) => {
                const { bandDataArr } = ve.data;
                setAudioData({
                  analysis: {
                    fftSequence: fftSequence ?? [],
                    normalizedFftSequence: e.data.normalizedFftSequence ?? [],
                    summary: newSummary ?? null,
                    audioBuffer: audioBuffer ?? null,
                    bandDataArr,
                    impulseStrengths: Array.isArray(bandDataArr) ? bandDataArr.map((b: { impulseStrengths: number[] }) => b.impulseStrengths) : [],
                    detectionFunction: detectionFunction || [],
                    detectionTimes: times || [],
                  }
                });
                setLoading(false);
                setProcessingProgress(null);
              };
              visualizationWorkerRef.current.postMessage({
                fftSequence: (fftSequence ?? []).map((arr: number[] | Float32Array) => Array.isArray(arr) ? arr : Array.from(arr)),
                bands: BAND_DEFINITIONS,
                sampleRate: audioBuffer?.sampleRate || 44100,
                hopSize: newSummary?.hopSize || 512,
                impulseWindowSize,
                impulseSmoothing,
                impulseDetectionMode,
                minDb,
                minDbDelta,
              });
            } else {
              // Fallback: just save fftSequence etc.
              setAudioData({ analysis: {
                fftSequence: fftSequence ?? [],
                normalizedFftSequence: e.data.normalizedFftSequence ?? [],
                summary: newSummary ?? null,
                audioBuffer: audioBuffer ?? null,
                detectionFunction: detectionFunction || [],
                detectionTimes: times || [],
              }});
              setLoading(false);
              setProcessingProgress(null);
            }
          }
        }
      };
      audioWorkerRef.current!.postMessage({
        pcmBuffer: pcmData.buffer,
        windowSize,
        hopSize,
        engine: selectedEngine,
        jobId,
      });
      lastProcessedSettings.current = {
        impulseWindowSize,
        impulseSmoothing,
        impulseDetectionMode,
        derivativeMode,
        spectralFluxWindow,
        spectralFluxK,
        spectralFluxMinSeparation,
        minDb,
        minDbDelta,
        windowSize,
        hopSize,
        selectedEngine,
      };
    } catch {
      alert('Error decoding audio file.');
      setLoading(false);
      setProcessingProgress(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2, mt: 1 }}>
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
        sx={{ minWidth: 110 }}
      >
        Choose File
      </Button>
      <Typography variant="body2" sx={{ minWidth: 120, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file ? file.name : 'No file chosen'}
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={handleProcess}
        disabled={!file || loading}
        sx={{ minWidth: 120 }}
      >
        {loading ? 'Processing...' : 'Process Audio'}
      </Button>
    </Box>
  );
};

export default AudioFileControls; 