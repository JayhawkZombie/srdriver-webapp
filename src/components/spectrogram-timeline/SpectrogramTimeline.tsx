import React from 'react';
import { SpectrogramTimelineProvider, PlaybackProvider } from './SpectrogramTimelineProvider';
import SpectrogramRenderer from './SpectrogramRenderer';
import TimeTracks from './TimeTracks';
import { useAppStore } from '../../store/appStore';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';

const SpectrogramTimeline: React.FC = () => {
  // Get real audio data and FFT from the global store
  const audioBuffer = useAppStore(state => state.audioData?.analysis?.audioBuffer);
  const fftSequence = useAppStore(state => state.audioData?.analysis?.fftSequence);
  const loading = useAppStore(state => state.loading);
  const processingProgress = useAppStore(state => state.processingProgress);

  if (!audioBuffer || !fftSequence || fftSequence.length === 0) {
    return (
      <Box sx={{ width: '100%', height: 220, background: '#222', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', margin: '16px 0', position: 'relative' }}>
        {loading ? (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
              Processing audio...
            </Typography>
            {(() => {
              if (!processingProgress) return null;
              const processedNum = Number(processingProgress.processed);
              const totalNum = Number(processingProgress.total);
              if (Number.isFinite(processedNum) && Number.isFinite(totalNum)) {
                return (
                  <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={100 * processedNum / totalNum}
                    />
                    <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                      {`Processed ${processedNum} of ${totalNum} chunks`}
                    </Typography>
                  </Box>
                );
              }
              return null;
            })()}
          </Box>
        ) : (
          <Typography variant="h6" sx={{ color: '#888' }}>
            Spectrogram will appear here (no audio loaded)
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <SpectrogramTimelineProvider>
      <PlaybackProvider>
        <div style={{ position: 'relative', width: '100%', height: 220, margin: '16px 0' }}>
          <SpectrogramRenderer audioBuffer={audioBuffer} fftSequence={fftSequence} />
          <TimeTracks audioBuffer={audioBuffer} />
        </div>
      </PlaybackProvider>
    </SpectrogramTimelineProvider>
  );
};

export default SpectrogramTimeline; 