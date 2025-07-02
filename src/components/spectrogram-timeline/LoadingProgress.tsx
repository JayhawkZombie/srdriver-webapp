import React from 'react';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';
import { useAppStore } from '../../store/appStore';

const LoadingProgress: React.FC = () => {
  const loading = useAppStore(state => state.loading);
  const processingProgress = useAppStore(state => state.processingProgress);

  if (!loading) return null;

  return (
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
  );
};

export default LoadingProgress; 