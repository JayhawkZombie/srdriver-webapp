import React from 'react';
import { Box, Typography, Slider, Stack, Tooltip, IconButton } from '@mui/material';
import { usePulseControls } from '../../controllers/PulseControlsContext';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface PulseControlsPanelProps {
  compact?: boolean;
}

// Reusable labeled slider with optional tooltip
type LabeledSliderProps = {
  label: string;
  tooltip?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (event: React.SyntheticEvent | Event, value: number | number[]) => void;
  size?: 'small' | 'medium';
  sx?: object;
};
function LabeledSlider({
  label,
  tooltip,
  min,
  max,
  step = 1,
  value,
  onChange,
  size = 'medium',
  sx = {},
}: LabeledSliderProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: size === 'small' ? 12 : 16, mb: 0.5 }}>{label}</Typography>
        {tooltip && (
          <Tooltip title={tooltip}>
            <IconButton size={size} sx={{ p: 0 }}>
              <InfoOutlinedIcon fontSize={size === 'small' ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        valueLabelDisplay="auto"
        size={size}
        sx={sx}
      />
    </Box>
  );
}

const PulseControlsPanel: React.FC<PulseControlsPanelProps> = ({ compact = false }) => {
  const { sensitivity, width, interval, setControls } = usePulseControls();

  if (compact) {
    return (
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LabeledSlider
            label="Sensitivity"
            tooltip="How easily the system detects and responds to impulses."
            min={0}
            max={1}
            step={0.01}
            value={sensitivity}
            onChange={(_, value) => setControls({ sensitivity: value as number })}
            size="small"
            sx={{ height: 24, minWidth: 90, width: "100%" }}
          />
          <LabeledSlider
            label="Duration"
            tooltip="How long each pulse lasts (in milliseconds)."
            min={10}
            max={500}
            step={1}
            value={width}
            onChange={(_, value) => setControls({ width: value as number })}
            size="small"
            sx={{ height: 24, minWidth: 90, width: "100%" }}
          />
          <LabeledSlider
            label="Interval"
            tooltip="Minimum time between any two pulses (rate limit)."
            min={10}
            max={1000}
            step={1}
            value={interval}
            onChange={(_, value) => setControls({ interval: value as number })}
            size="small"
            sx={{ height: 24, minWidth: 90, width: "100%" }}
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Pulse Controls</Typography>
      <Stack spacing={3}>
        <LabeledSlider
          label={`Sensitivity: ${sensitivity.toFixed(2)}`}
          tooltip="How easily the system detects and responds to impulses."
          min={0}
          max={1}
          step={0.01}
          value={sensitivity}
          onChange={(_, value) => setControls({ sensitivity: value as number })}
        />
        <LabeledSlider
          label={`Duration (ms): ${width}`}
          tooltip="How long each pulse lasts (in milliseconds)."
          min={10}
          max={500}
          step={1}
          value={width}
          onChange={(_, value) => setControls({ width: value as number })}
        />
        <LabeledSlider
          label={`Interval (ms): ${interval}`}
          tooltip="Minimum time between any two pulses (rate limit)."
          min={10}
          max={1000}
          step={1}
          value={interval}
          onChange={(_, value) => setControls({ interval: value as number })}
        />
      </Stack>
    </Box>
  );
};

export default PulseControlsPanel; 