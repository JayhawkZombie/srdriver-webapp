import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAppStore } from '../store/appStore';
import BandPlot from './BandPlot';

const AudioFrequencyVisualizer: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const plotBg = isDark ? theme.palette.background.paper : '#fafbfc';
  const axisColor = isDark ? theme.palette.text.primary : '#222';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Read from global state
  const hopSize = useAppStore(state => state.hopSize);
  const playbackTime = useAppStore(state => state.playbackTime);
  const windowSec = useAppStore(state => state.windowSec);
  const selectedBand = useAppStore(state => state.selectedBand);
  const analysis = useAppStore(state => state.audioData.analysis);
  const bandDataArr = (analysis?.bandDataArr ?? []) as Array<{ band: { name: string } }>;
  const fftSequence = analysis?.fftSequence ?? [];
  const sampleRate = analysis?.audioBuffer?.sampleRate ?? 44100;

  // Compute xRange for paged windowing
  const times = useMemo(() => Array.from({ length: fftSequence.length }, (_, i) => (i * hopSize) / sampleRate), [fftSequence.length, hopSize, sampleRate]);
  const maxTime = times.length > 0 ? times[times.length - 1] : 0;
  const windowIdx = Math.floor(playbackTime / windowSec);
  let left = windowIdx * windowSec;
  let right = (windowIdx + 1) * windowSec;
  if (right > maxTime) {
    right = maxTime;
    left = Math.max(0, right - windowSec);
  }
  const xRange: [number, number] = [left, right];
  const selectedBandIdx = bandDataArr.findIndex(b => b.band.name === selectedBand);

  return (
    <Box
      sx={{
        width: '100%',
        margin: '1rem 0',
        p: 1.2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        maxHeight: 600,
        overflowY: 'auto',
        overflowX: 'auto',
      }}
    >
      <Typography variant="h5" sx={{ mb: 1 }}>
        Frequency Band Magnitude Over Time
      </Typography>
      {/* Render the selected band plot using the new BandPlot component */}
      <BandPlot
        key={playbackTime}
        bandIdx={selectedBandIdx}
        xRange={xRange}
        playbackTime={playbackTime}
        isDark={isDark}
        axisColor={axisColor}
        gridColor={gridColor}
        plotBg={plotBg}
      />
    </Box>
  );
};

export default AudioFrequencyVisualizer; 