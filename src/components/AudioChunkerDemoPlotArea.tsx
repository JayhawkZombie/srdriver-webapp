import React from 'react';
import { Box, Typography, Skeleton, CircularProgress, LinearProgress } from '@mui/material';
import AudioFrequencyVisualizer from './AudioFrequencyVisualizer';

interface AudioChunkerDemoPlotAreaProps {
  file: File | null;
  loading: boolean;
  processingProgress: { processed: number; total: number } | null;
  audioData: any;
  plotProps: any;
  debouncedPulse: (...args: any[]) => void;
  onImpulse?: (strength: number, min: number, max: number, bandName?: string, time?: number) => void;
}

const AudioChunkerDemoPlotArea: React.FC<AudioChunkerDemoPlotAreaProps> = ({
  file,
  loading,
  processingProgress,
  audioData,
  plotProps,
  debouncedPulse,
  onImpulse,
}) => {
  const hasAnalysis = audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0 && audioData.analysis.audioBuffer;

  // Only show the plot when loading is false and hasAnalysis is true
  const showPlot = !loading && hasAnalysis;

  // Overlay style for loading spinner/progress
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    zIndex: 2,
    pointerEvents: 'none',
    // Remove or lighten the background overlay
    bgcolor: 'transparent',
    opacity: 1,
  };

  return (
    <Box sx={{ minHeight: 340, width: '100%', mt: 2, position: 'relative', bgcolor: 'background.paper', borderRadius: 2, p: 2, boxSizing: 'border-box' }}>
      {!file ? (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
            Upload an audio file to begin analysis
          </Typography>
          {[0,1,2].map(i => (
            <Box key={i} sx={{ mb: 2, width: '100%' }}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 1 }} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          ))}
        </Box>
      ) : (!showPlot ? (
        // Show skeleton and, if loading, overlay the spinner/progress
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {loading ? (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                Processing audio...
              </Typography>
              {processingProgress && (
                <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={100 * processingProgress.processed / processingProgress.total}
                  />
                  <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                    {`Processed ${processingProgress.processed} of ${processingProgress.total} chunks`}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              Click 'Process Audio' to begin analysis.
            </Typography>
          )}
          {[0,1,2].map(i => (
            <Box key={i} sx={{ mb: 2, width: '100%' }}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 1 }} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          ))}
        </Box>
      ) : (
        <AudioFrequencyVisualizer
          {...plotProps}
          onImpulse={onImpulse || debouncedPulse}
        />
      ))}
    </Box>
  );
};

export default AudioChunkerDemoPlotArea; 