import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Plot from 'react-plotly.js';
import { Box, Button, ButtonGroup, Checkbox, FormControlLabel, Slider, Typography, Select, MenuItem, FormGroup, Card, CardContent, Skeleton, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// @ts-ignore
import visualizationWorkerUrl from '../controllers/visualizationWorker.ts?worker';
import useBandPlots, { BandPlotData } from './useBandPlots';
import { FixedSizeList as List } from 'react-window';
import useAudioFrequencyData from './useAudioFrequencyData';
import BandSelector from './BandSelector';
import GlobalControls from './GlobalControls';
import DerivativeImpulseToggles from './DerivativeImpulseToggles';

interface AudioFrequencyVisualizerProps {
  /**
   * Sequence of FFT magnitude arrays (each is a Float32Array or number[])
   * Each array represents one time slice (row in the spectrogram)
   */
  fftSequence: (Float32Array | number[])[];
  /**
   * Sample rate of the audio (Hz)
   */
  sampleRate: number;
  /**
   * FFT window size (number of samples per FFT)
   */
  windowSize: number;
  /**
   * Max number of time slices to display (for scrolling effect)
   */
  maxSlices?: number;
  /**
   * Hop size (number of samples between consecutive FFTs)
   */
  hopSize: number;
  /**
   * The decoded AudioBuffer for playback (optional)
   */
  audioBuffer?: AudioBuffer;
  /**
   * (Optional) Playback time in seconds, to externally control the cursor (e.g. from wavesurfer)
   */
  playbackTime?: number;
}

const LIGHT_BAND_COLORS = [
  { name: 'Bass', freq: 60, color: 'blue' },
  { name: 'Low Mid', freq: 250, color: 'green' },
  { name: 'Mid', freq: 1000, color: 'orange' },
  { name: 'Treble', freq: 4000, color: 'red' },
  { name: 'High Treble', freq: 8000, color: 'purple' },
];
const DARK_BAND_COLORS = [
  { name: 'Bass', freq: 60, color: '#4FC3F7' },      // light blue/cyan
  { name: 'Low Mid', freq: 250, color: '#81C784' }, // light green
  { name: 'Mid', freq: 1000, color: '#FFD54F' },    // yellow/gold
  { name: 'Treble', freq: 4000, color: '#FF8A65' }, // orange
  { name: 'High Treble', freq: 8000, color: '#BA68C8' }, // light purple
];

// Helper to lighten a hex color for dark mode
function lightenColor(hex: string, amount = 0.5) {
  // hex: "#RRGGBB"
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * amount);
  let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * amount);
  let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * amount);
  r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
  return `rgb(${r},${g},${b})`;
}

const BandPlotCard = memo(({
  data,
  xRange,
  axisColor,
  gridColor,
  plotBg,
  showImpulses,
  impulseThresholds,
  setImpulseThresholds,
  showFirstDerivative,
  showSecondDerivative,
}: {
  data: BandPlotData;
  xRange: [number, number];
  axisColor: string;
  gridColor: string;
  plotBg: string;
  showImpulses: boolean;
  impulseThresholds: number[];
  setImpulseThresholds: (thresholds: number[]) => void;
  showFirstDerivative: boolean;
  showSecondDerivative: boolean;
}) => {
  const traces = React.useMemo(() => [
    data.traces.magnitude,
    ...(showFirstDerivative ? [data.traces.derivative] : []),
    ...(showSecondDerivative ? [data.traces.secondDerivative] : []),
    ...(showImpulses ? [data.traces.impulses] : []),
    data.cursorTrace,
  ], [data, showFirstDerivative, showSecondDerivative, showImpulses]);

  // Auto-scale y-axis based on visible magnitude data
  const yVals = data.traces.magnitude.y as number[];
  let yMin = Math.min(...yVals);
  let yMax = Math.max(...yVals);
  let margin = (yMax - yMin) * 0.1 || 1;
  yMin -= margin;
  yMax += margin;

  return (
    <Card key={data.band.name} sx={{ mb: 2, bgcolor: data.band.color + '10', boxShadow: 2, p: 0.5 }}>
      <CardContent sx={{ p: 1.2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1, overflow: 'visible' }}>
          {showImpulses && (
            <>
              <Typography variant="body2" sx={{ color: data.band.color, minWidth: 60, fontWeight: 500, fontSize: 13 }}>
                {data.band.name} Threshold:
              </Typography>
              <Slider
                min={data.sliderMin}
                max={data.sliderMax}
                step={data.sliderStep}
                value={data.threshold}
                onChange={(_, v) => {
                  const newThresholds = [...impulseThresholds];
                  newThresholds[data.bandIdx] = typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 0);
                  setImpulseThresholds(newThresholds);
                }}
                valueLabelDisplay="on"
                valueLabelFormat={v => (typeof v === 'number' ? v.toFixed(1) : v)}
                size="small"
                sx={{ width: 130, ml: 0, mr: 2 }}
                marks={false}
              />
            </>
          )}
          <div style={{ color: data.band.color, fontWeight: 700, fontSize: 16, margin: 0, lineHeight: 1 }}>{data.band.name} ({Math.round(data.freq)} Hz)</div>
        </Box>
        <Box sx={{ width: '100%', p: 0.5, pt: 0, pb: 0, boxSizing: 'border-box' }}>
          <Plot
            data={traces}
            layout={{
              height: 280,
              margin: { l: 40, r: 10, t: 10, b: 24 },
              xaxis: {
                title: 'Time (seconds)',
                automargin: true,
                range: xRange,
                titlefont: { size: 11 },
                tickfont: { size: 9 },
                color: axisColor,
                gridcolor: gridColor,
              },
              yaxis: {
                title: 'Magnitude (dB)',
                range: [yMin, yMax],
                automargin: true,
                titlefont: { size: 11 },
                tickfont: { size: 9 },
                color: axisColor,
                gridcolor: gridColor,
              },
              yaxis2: {
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                zeroline: false,
                showticklabels: false,
              },
              yaxis3: {
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                zeroline: false,
                showticklabels: false,
                position: 1.0,
              },
              paper_bgcolor: plotBg,
              plot_bgcolor: plotBg,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
});

const AudioFrequencyVisualizer: React.FC<AudioFrequencyVisualizerProps> = ({
  fftSequence,
  sampleRate,
  windowSize,
  hopSize,
  audioBuffer,
  playbackTime: externalPlaybackTime,
  // maxSlices = 64, // unused for this plot
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const plotBg = isDark ? theme.palette.background.paper : '#fafbfc';
  const cardBg = isDark ? theme.palette.background.default : '#f5f7fa';
  const axisColor = isDark ? theme.palette.text.primary : '#222';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const STANDARD_BANDS = useMemo(() => {
    return isDark ? DARK_BAND_COLORS : LIGHT_BAND_COLORS;
  }, [isDark]);

  // --- Playback state (move hooks to top) ---
  const [internalPlaybackTime, setInternalPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, etc.
  const [followCursor, setFollowCursor] = useState(false);
  const [windowSec, setWindowSec] = useState(4); // default window size in seconds
  const [snapToWindow, setSnapToWindow] = useState(true); // New: snap to window toggle
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Audio playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0); // When audio started (context time)
  const pausedAtRef = useRef<number>(0); // Where we paused

  // --- New state for toggles and impulse threshold ---
  const [showFirstDerivative, setShowFirstDerivative] = useState(false);
  const [showSecondDerivative, setShowSecondDerivative] = useState(false);
  const [showImpulses, setShowImpulses] = useState(true);

  const playbackTime = externalPlaybackTime !== undefined ? externalPlaybackTime : internalPlaybackTime;

  // --- Use new computation hook ---
  const {
    bandDataArr,
    impulseThresholds,
    setImpulseThresholds,
    visualizing,
    visualizationStatus,
    xRange,
    maxTime,
    freqs,
  } = useAudioFrequencyData({
    fftSequence,
    sampleRate,
    hopSize,
    bands: STANDARD_BANDS,
    playbackTime,
    windowSec,
    followCursor,
    snapToWindow,
    isDark,
    axisColor,
    gridColor,
    plotBg,
  });

  // Memoized band plots, only depends on bandDataArr and display toggles
  const bandPlotsData: BandPlotData[] = useBandPlots({
    bandDataArr,
    xRange,
    impulseThresholds,
    playbackTime,
    isDark,
    hopSize,
    sampleRate,
    freqs,
    axisColor,
    gridColor,
    plotBg,
    setImpulseThresholds,
  });

  const numBins = fftSequence[0]?.length || 0;

  // --- Band selection state ---
  const [selectedBands, setSelectedBands] = useState<string[]>([]);
  useEffect(() => {
    if (bandPlotsData.length > 0 && selectedBands.length === 0) {
      setSelectedBands([bandPlotsData[0].band.name]);
    }
  }, [bandPlotsData]);

  // Show a message if there is no data to display
  if (bandPlotsData.length === 0 || bandPlotsData.every(b => !b.traces.magnitude.x || b.traces.magnitude.x.length === 0)) {
    return <Typography sx={{mt:2, textAlign:'center'}}>No data to display. Try loading and processing audio.</Typography>;
  }

  // Controls
  const handlePlay = () => {
    setIsPlaying(true);
  };
  const handlePause = () => {
    setIsPlaying(false);
    pausedAtRef.current = playbackTime;
  };
  const handleReset = () => {
    if (externalPlaybackTime === undefined) setInternalPlaybackTime(0);
    setIsPlaying(false);
    pausedAtRef.current = 0;
  };
  const handleSpeedChange = (e: SelectChangeEvent<number>) => setPlaybackSpeed(Number(e.target.value));

  if (numBins === 0) return null;

  if (visualizing) {
    return (
      <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto', my: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            {visualizationStatus || 'Preparing visualizations...'}
          </Typography>
        </Box>
        {[0,1,2,3,4].map(i => (
          <Box key={i} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 1 }} />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        margin: '1rem 0',
        p: 1.2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        maxHeight: 600,
        overflowY: 'auto',
        overflowX: 'auto',
      }}
    >
      <Typography variant="h5" sx={{ mb: 1 }}>
        Frequency Band Magnitude Over Time
      </Typography>
      {/* Global controls */}
      <GlobalControls
        windowSec={windowSec}
        maxTime={maxTime}
        onWindowSecChange={setWindowSec}
        followCursor={followCursor}
        onFollowCursorChange={setFollowCursor}
        snapToWindow={snapToWindow}
        onSnapToWindowChange={setSnapToWindow}
      />
      {/* Derivative/Impulse toggles */}
      <DerivativeImpulseToggles
        showFirstDerivative={showFirstDerivative}
        onShowFirstDerivative={setShowFirstDerivative}
        showSecondDerivative={showSecondDerivative}
        onShowSecondDerivative={setShowSecondDerivative}
        showImpulses={showImpulses}
        onShowImpulses={setShowImpulses}
      />
      {/* New: Band selection toggle */}
      <Box sx={{ mb: 2 }}>
        <BandSelector
          bands={bandPlotsData.map(data => ({ name: data.band.name }))}
          selectedBand={selectedBands[0] || ''}
          onSelect={bandName => setSelectedBands([bandName])}
        />
      </Box>
      {/* Band plot list (no virtualization) */}
      {bandPlotsData
        .filter(data => selectedBands.includes(data.band.name))
        .map(data => (
          <Box key={data.band.name}>
            <BandPlotCard
              data={data}
              xRange={xRange}
              axisColor={axisColor}
              gridColor={gridColor}
              plotBg={plotBg}
              showImpulses={showImpulses}
              impulseThresholds={impulseThresholds}
              setImpulseThresholds={setImpulseThresholds}
              showFirstDerivative={showFirstDerivative}
              showSecondDerivative={showSecondDerivative}
            />
          </Box>
        ))}
    </Box>
  );
};

export default AudioFrequencyVisualizer; 