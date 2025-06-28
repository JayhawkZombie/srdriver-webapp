import React from 'react';
import { Box, Typography, Slider, Stack, Tooltip, IconButton } from '@mui/material';
import { usePulseControls } from '../controllers/PulseControlsContext';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface PulseControlsPanelProps {
  compact?: boolean;
}

const PulseControlsPanel: React.FC<PulseControlsPanelProps> = ({ compact = false }) => {
  const { sensitivity, width, interval, setControls } = usePulseControls();

  if (compact) {
    return (
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ minWidth: 90 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Sensitivity</Typography>
              <Tooltip title="How easily the system detects and responds to impulses.">
                <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={sensitivity}
              onChange={(_, value) => setControls({ sensitivity: value as number })}
              valueLabelDisplay="auto"
              size="small"
              sx={{ height: 24 }}
            />
          </Box>
          <Box sx={{ minWidth: 90 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Duration</Typography>
              <Tooltip title="How long each pulse lasts (in milliseconds).">
                <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Slider
              min={10}
              max={500}
              step={1}
              value={width}
              onChange={(_, value) => setControls({ width: value as number })}
              valueLabelDisplay="auto"
              size="small"
              sx={{ height: 24 }}
            />
          </Box>
          <Box sx={{ minWidth: 90 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: 12, mb: 0.5 }}>Interval</Typography>
              <Tooltip title="Minimum time between any two pulses (rate limit).">
                <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Slider
              min={10}
              max={1000}
              step={1}
              value={interval}
              onChange={(_, value) => setControls({ interval: value as number })}
              valueLabelDisplay="auto"
              size="small"
              sx={{ height: 24 }}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Pulse Controls</Typography>
      <Stack spacing={3}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography gutterBottom>Sensitivity: {sensitivity.toFixed(2)}</Typography>
            <Tooltip title="How easily the system detects and responds to impulses.">
              <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={sensitivity}
            onChange={(_, value) => setControls({ sensitivity: value as number })}
            valueLabelDisplay="auto"
          />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography gutterBottom>Duration (ms): {width}</Typography>
            <Tooltip title="How long each pulse lasts (in milliseconds).">
              <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          <Slider
            min={10}
            max={500}
            step={1}
            value={width}
            onChange={(_, value) => setControls({ width: value as number })}
            valueLabelDisplay="auto"
          />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography gutterBottom>Interval (ms): {interval}</Typography>
            <Tooltip title="Minimum time between any two pulses (rate limit).">
              <IconButton size="small" sx={{ p: 0 }}><InfoOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          <Slider
            min={10}
            max={1000}
            step={1}
            value={interval}
            onChange={(_, value) => setControls({ interval: value as number })}
            valueLabelDisplay="auto"
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default PulseControlsPanel; 