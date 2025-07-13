import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import type { SDCardBLEClient } from './SDCardBLEClient';
import { ChunkReassembler, type ChunkEnvelope } from './ChunkReassembler';

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
    const reassembler = new ChunkReassembler();
    const onChunk = (chunk: ChunkEnvelope) => {
      console.log('[SDCardFileViewer] Received chunk:', chunk);
      if (chunk.t !== 'D') return; // Only handle PRINT/file data
      const full = reassembler.addChunk(chunk);
      if (full) {
        console.log('[SDCardFileViewer] Reassembled file content:', full);
        setContent(full);
        setLoading(false);
      }
    };
    bleClient.setOnChunk(onChunk);
    bleClient.setOnComplete(() => {}); // No-op, we handle completion in onChunk
    console.log('[SDCardFileViewer] Sending PRINT command for', filePath);
    bleClient.sendCommand(`PRINT ${filePath}`);
    return () => {
      bleClient.setOnChunk(() => {});
      bleClient.setOnComplete(() => {});
    };
  }, [bleClient, filePath]);

  if (!filePath) return null;
  if (loading) return <Box sx={{ p: 2 }}><CircularProgress size={20} /> Loading file…</Box>;
  if (error) return <Box sx={{ p: 2, color: 'red' }}>{error}</Box>;
  return <Box sx={{ p: 2, whiteSpace: 'pre', fontFamily: 'monospace', background: '#181c20', color: '#fff', borderRadius: 2 }}>{content}</Box>;
}; 