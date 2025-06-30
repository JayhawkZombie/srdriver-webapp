import React from 'react';
import { Box, Typography, Slider, FormControlLabel, Checkbox, Paper, Divider, Tooltip } from '@mui/material';
import { useAppStore } from '../store/appStore';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useDeviceControllerContext } from '../controllers/DeviceControllerContext';

interface GlobalControlsProps {
  followCursor: boolean;
  onFollowCursorChange: (checked: boolean) => void;
  snapToWindow: boolean;
  onSnapToWindowChange: (checked: boolean) => void;
}

const GlobalControls: React.FC<GlobalControlsProps> = ({
  followCursor,
  onFollowCursorChange,
  snapToWindow,
  onSnapToWindowChange,
}) => {
  const bleLookaheadMs = useAppStore(state => state.bleLookaheadMs);
  const setBleLookaheadMs = useAppStore(state => state.setBleLookaheadMs);
  const minMagnitudeThreshold = useAppStore(state => state.minMagnitudeThreshold);
  const setMinMagnitudeThreshold = useAppStore(state => state.setMinMagnitudeThreshold);
  const activeDeviceId = useAppStore(state => state.activeDeviceId);
  const { devices } = useDeviceControllerContext();
  const activeDevice = devices.find(d => d.id === activeDeviceId);
  const bleRTT = activeDevice?.bleRTT;

  return (
    <Paper sx={{ p: 1.5, mb: 1, width: 420, minWidth: 320 }}>
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <VolumeUpIcon sx={{ mr: 1 }} />
          <Tooltip title={bleRTT ? `Double-click to set to BLE RTT (${bleRTT} ms)` : 'Double-click to set to BLE RTT'}>
            <Typography variant="subtitle2" sx={{ mr: 2 }}>BLE Lookahead (ms)</Typography>
          </Tooltip>
          <Typography variant="body2">{bleLookaheadMs}</Typography>
        </Box>
        <Slider
          value={bleLookaheadMs}
          onChange={(_, v) => setBleLookaheadMs(Number(v))}
          min={0}
          max={500}
          step={5}
          valueLabelDisplay="auto"
          sx={{ width: 160 }}
          onDoubleClick={() => {
            if (bleRTT) setBleLookaheadMs(Math.round(bleRTT / 5) * 5);
          }}
        />
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FilterAltIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ mr: 2, color: 'primary.main' }}>
            Min Magnitude Threshold
          </Typography>
          <Tooltip title="Ignore frequencies below this magnitude (filters out noise)">
            <Typography variant="caption" color="primary" sx={{ ml: 1, fontWeight: 700 }}>
              NEW
            </Typography>
          </Tooltip>
          <Typography variant="body2" sx={{ ml: 2 }}>{minMagnitudeThreshold.toExponential(2)}</Typography>
        </Box>
        <Slider
          min={1e-8}
          max={1e-3}
          step={1e-8}
          value={minMagnitudeThreshold}
          onChange={(_, v) => setMinMagnitudeThreshold(Number(v))}
          valueLabelDisplay="auto"
          size="small"
          color="primary"
          sx={{ width: 160 }}
        />
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
        <FormControlLabel
          control={<Checkbox checked={followCursor} onChange={e => onFollowCursorChange(e.target.checked)} />}
          label="Follow Cursor"
        />
        <FormControlLabel
          control={<Checkbox checked={snapToWindow} onChange={e => onSnapToWindowChange(e.target.checked)} />}
          label="Snap to Window"
        />
      </Box>
    </Paper>
  );
};

export default GlobalControls; 