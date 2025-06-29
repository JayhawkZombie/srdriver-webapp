import React, { useState } from 'react';
import { Box, IconButton, Drawer, Typography, Tooltip } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { useAppStore } from '../store/appStore';

const isDev = process.env.NODE_ENV === 'development';

const DevAppStateViewer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const appState = useAppStore();
  const [copied, setCopied] = useState(false);

  // Show the entire app state for debugging
  const fullState = appState;

  if (!isDev) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fullState, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <>
      <Tooltip title="Show App State">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{ alignSelf: 'center', p: 0.5 }}
          size="medium"
        >
          <BugReportIcon fontSize="medium" />
        </IconButton>
      </Tooltip>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 400, p: 2, bgcolor: 'background.default' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">App State</Typography>
          <Box>
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton onClick={handleCopy} size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ maxHeight: '80vh', overflow: 'auto', fontFamily: 'monospace', fontSize: 13, bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
          <pre style={{ margin: 0 }}>{JSON.stringify(fullState, null, 2)}</pre>
        </Box>
      </Drawer>
    </>
  );
};

export default DevAppStateViewer; 