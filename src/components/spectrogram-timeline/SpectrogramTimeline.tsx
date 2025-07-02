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
  // Use timeline state for playhead and playback
  // const { playhead, setPlayhead, startPlayhead, stopPlayhead } = useTimelineState({
  //   defaultTracks: [ { name: 'Bass', type: 'frequency' }, { name: 'Snare', type: 'frequency' }, { name: 'FX', type: 'custom' }, { name: 'Lights', type: 'device' } ],
  //   duration: audioBuffer ? audioBuffer.duration : 15
  // });
  // const [isPlaying, setIsPlaying] = React.useState(false);
  // // Play/pause handlers
  // const handlePlayPause = (playing: boolean) => {
  //   setIsPlaying(playing);
  //   if (playing) startPlayhead();
  //   else stopPlayhead();
  // };
  // // Seek handler
  // const handleSeek = (time: number) => {
  //   setPlayhead(time);
  // };
  // // Reset handler
  // const handleReset = () => {
  //   setIsPlaying(false);
  //   stopPlayhead();
  //   setPlayhead(0);
  // };

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