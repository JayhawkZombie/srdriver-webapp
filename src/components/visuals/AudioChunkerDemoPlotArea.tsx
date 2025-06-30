import React from 'react';
import { Box, Typography, Skeleton, CircularProgress, LinearProgress } from '@mui/material';
import AudioFrequencyVisualizer from './AudioFrequencyVisualizer';

interface AudioChunkerDemoPlotAreaProps {
  file: File | null;
  loading: boolean;
  processingProgress: { processed: number; total: number } | null;
  audioData: any;
  debouncedPulse: (...args: any[]) => void;
  onImpulse?: (strength: number, min: number, max: number, bandName?: string, time?: number) => void;
}

const AudioChunkerDemoPlotArea: React.FC<AudioChunkerDemoPlotAreaProps> = ({
  file,
  loading,
  processingProgress,
  audioData,
  debouncedPulse,
  onImpulse,
}) => {
  const hasAnalysis = audioData.analysis?.fftSequence && audioData.analysis.fftSequence.length > 0 && audioData.analysis.audioBuffer;
  const showPlot = !loading && hasAnalysis;

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
      ) : (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {loading ? (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                Processing audio...
              </Typography>
              {(() => {
                if (!processingProgress) return null;
                // eslint-disable-next-line no-console
                console.log('ProgressBar render:', {
                  processingProgress,
                  processed: processingProgress.processed,
                  total: processingProgress.total,
                  processedType: typeof processingProgress.processed,
                  totalType: typeof processingProgress.total,
                });
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
          ) : showPlot ? (
            <AudioFrequencyVisualizer />
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export default AudioChunkerDemoPlotArea; 