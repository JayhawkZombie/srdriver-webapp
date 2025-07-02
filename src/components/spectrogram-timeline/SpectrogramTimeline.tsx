import React from 'react';
import { SpectrogramTimelineProvider, PlaybackProvider } from './SpectrogramTimelineProvider';
import TimeTracks from './TimeTracks';
import { useAppStore } from '../../store/appStore';
import { Box, Typography } from '@mui/material';
import LoadingProgress from './LoadingProgress';

const SpectrogramTimeline: React.FC = () => {
  // Get real audio data and FFT from the global store
  const audioBuffer = useAppStore(state => state.audioData?.analysis?.audioBuffer);
  const fftSequence = useAppStore(state => state.audioData?.analysis?.normalizedFftSequence || state.audioData?.analysis?.fftSequence);
  const loading = useAppStore(state => state.loading);

  if (!audioBuffer || !fftSequence || fftSequence.length === 0) {
    return (
      <Box sx={{ width: '100%', height: 220, background: '#222', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', margin: '16px 0', position: 'relative' }}>
        <LoadingProgress />
        {!loading && (
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
        <div style={{ position: 'relative', width: '100%', height: 'auto', margin: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <TimeTracks audioBuffer={audioBuffer} />
        </div>
      </PlaybackProvider>
    </SpectrogramTimelineProvider>
  );
};

export default SpectrogramTimeline; 