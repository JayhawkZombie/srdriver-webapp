import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import type { SDCardBLEClient } from './SDCardBLEClient';

export const SDCardFileViewer: React.FC<{ bleClient: SDCardBLEClient | null; filePath: string | null }> = ({ bleClient, filePath }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bleClient || !filePath) return;
    setLoading(true);
    setError(null);
    setContent(null);
    bleClient.reset();
    bleClient.setOnComplete((json) => {
      try {
        setContent(json);
        setLoading(false);
      } catch {
        setError('Failed to parse file content');
        setLoading(false);
      }
    });
    bleClient.sendCommand(`PRINT ${filePath}`);
  }, [bleClient, filePath]);

  if (!filePath) return null;
  if (loading) return <Box sx={{ p: 2 }}><CircularProgress size={20} /> Loading file…</Box>;
  if (error) return <Box sx={{ p: 2, color: 'red' }}>{error}</Box>;
  return <Box sx={{ p: 2, whiteSpace: 'pre', fontFamily: 'monospace', background: '#181c20', color: '#fff', borderRadius: 2 }}>{content}</Box>;
}; 