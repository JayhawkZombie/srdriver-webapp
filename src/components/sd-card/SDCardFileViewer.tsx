import React from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import type { SDCardBLEClient } from './SDCardBLEClient';
import { useSDCardStream } from './useSDCardStream';

function toHexDump(data: Uint8Array, bytesPerRow = 16): string {
  const lines: string[] = [];
  for (let i = 0; i < data.length; i += bytesPerRow) {
    const row = data.slice(i, i + bytesPerRow);
    const hex = Array.from(row).map(b => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(row).map(b => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
    lines.push(hex.padEnd(bytesPerRow * 3) + '  ' + ascii);
  }
  return lines.join('\n');
}

export const SDCardFileViewer: React.FC<{ bleClient: SDCardBLEClient | null; filePath: string | null }> = ({ bleClient, filePath }) => {
  const { loading, error, data, sendCommand, reset, progress } = useSDCardStream<string | Uint8Array>(bleClient);

  React.useEffect(() => {
    if (!bleClient || !filePath) return;
    console.log('[SDCardFileViewer] Loading file:', filePath);
    sendCommand('PRINT', filePath);
    return () => {
      reset();
    };
  }, [bleClient, filePath, sendCommand, reset]);

  if (!filePath) return null;
  
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography>Loading file content…</Typography>
        </Box>
        {progress.total && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Receiving chunks: {progress.received}/{progress.total}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load file: {error}
        </Alert>
      </Box>
    );
  }
  
  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">No file content to display</Typography>
      </Box>
    );
  }

  // Text file
  if (typeof data === 'string') {
    console.log('[SDCardFileViewer] Displaying as text, length:', data.length);
    return (
      <Box sx={{ 
        p: 2, 
        whiteSpace: 'pre-wrap', 
        fontFamily: 'monospace', 
        fontSize: '0.875rem',
        background: '#181c20', 
        color: '#fff', 
        borderRadius: 2,
        maxHeight: '400px',
        overflow: 'auto',
        border: '1px solid #333'
      }}>
        {data}
      </Box>
    );
  }

  // Binary file (Uint8Array)
  if (data instanceof Uint8Array) {
    console.log('[SDCardFileViewer] Displaying as binary, length:', data.length);
    const hexDump = toHexDump(data);
    // Download handler
    const handleDownload = () => {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath ? filePath.split('/').pop() || 'file.bin' : 'file.bin';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    };
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Binary file detected. Displaying hex dump. <Button onClick={handleDownload} size="small" sx={{ ml: 2 }}>Download</Button>
        </Alert>
        <Box sx={{
          whiteSpace: 'pre',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          background: '#181c20',
          color: '#fff',
          borderRadius: 2,
          maxHeight: '400px',
          overflow: 'auto',
          border: '1px solid #333',
          p: 2
        }}>
          {hexDump}
        </Box>
      </Box>
    );
  }

  // Fallback
  return (
    <Box sx={{ p: 2 }}>
      <Typography color="text.secondary">Unknown file content type</Typography>
    </Box>
  );
}; 