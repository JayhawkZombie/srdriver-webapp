import React from 'react';
import { Box, Typography, Slider, Stack } from '@mui/material';
import { usePulseControls } from '../controllers/PulseControlsContext';

const PulseControlsPanel: React.FC = () => {
  const { sensitivity, width, interval, setControls } = usePulseControls();

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Pulse Controls</Typography>
      <Stack spacing={3}>
        <Box>
          <Typography gutterBottom>Sensitivity: {sensitivity.toFixed(2)}</Typography>
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
          <Typography gutterBottom>Pulse Width (ms): {width}</Typography>
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
          <Typography gutterBottom>Min Interval (ms): {interval}</Typography>
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