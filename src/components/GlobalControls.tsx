import React from 'react';
import { Box, Typography, Slider, FormControlLabel, Checkbox } from '@mui/material';
import { useAppStore } from '../store/appStore';

interface GlobalControlsProps {
  windowSec: number;
  maxTime: number;
  onWindowSecChange: (value: number) => void;
  followCursor: boolean;
  onFollowCursorChange: (checked: boolean) => void;
  snapToWindow: boolean;
  onSnapToWindowChange: (checked: boolean) => void;
}

const GlobalControls: React.FC<GlobalControlsProps> = ({
  windowSec,
  maxTime,
  onWindowSecChange,
  followCursor,
  onFollowCursorChange,
  snapToWindow,
  onSnapToWindowChange,
}) => {
  const bleLookaheadMs = useAppStore(state => state.bleLookaheadMs);
  const setBleLookaheadMs = useAppStore(state => state.setBleLookaheadMs);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
      <Typography variant="body2" sx={{ ml: 2 }}>
        Window Size:
      </Typography>
      <Slider
        min={2}
        max={Math.max(2, Math.ceil(maxTime))}
        value={windowSec}
        onChange={(_, v) => onWindowSecChange(Number(v))}
        valueLabelDisplay="auto"
        size="small"
        sx={{ width: 180 }}
      />
      <Typography variant="body2">{windowSec}s</Typography>
      <Slider
        value={bleLookaheadMs}
        onChange={(_, v) => setBleLookaheadMs(Number(v))}
        min={0}
        max={500}
        step={5}
        valueLabelDisplay="auto"
        sx={{ width: 180, ml: 2 }}
      />
      <Typography variant="caption" sx={{ ml: 1 }}>BLE Lookahead (ms)</Typography>
      <FormControlLabel
        control={<Checkbox checked={followCursor} onChange={e => onFollowCursorChange(e.target.checked)} />}
        label="Follow Cursor"
        sx={{ ml: 2 }}
      />
      <FormControlLabel
        control={<Checkbox checked={snapToWindow} onChange={e => onSnapToWindowChange(e.target.checked)} />}
        label="Snap to Window"
        sx={{ ml: 1 }}
      />
    </Box>
  );
};

export default GlobalControls; 