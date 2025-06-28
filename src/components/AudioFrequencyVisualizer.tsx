import React, { useState, useRef, useMemo, memo } from 'react';
import Plot from 'react-plotly.js';
import { Box, Slider, Typography, Card, CardContent, Skeleton, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// @ts-ignore
import visualizationWorkerUrl from '../controllers/visualizationWorker.ts?worker';
import useBandPlots, { BandPlotData } from './useBandPlots';
import useAudioFrequencyData from './useAudioFrequencyData';
import { usePulseContext } from '../controllers/PulseContext';

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
  windowSec: number;
  followCursor: boolean;
  snapToWindow: boolean;
  showFirstDerivative: boolean;
  showSecondDerivative: boolean;
  showImpulses: boolean;
  selectedBand: string;
  onImpulse?: (strength: number, min: number, max: number, bandName?: string, time?: number) => void;
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
  playbackTime,
  onImpulse = undefined,
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
  playbackTime: number;
  onImpulse?: (strength: number, min: number, max: number, bandName?: string, time?: number) => void;
}) => {
  const { emitPulse } = usePulseContext();
  const emittedPulsesRef = React.useRef<Set<string>>(new Set());
  const lastCursorRef = React.useRef<number>(-Infinity);

  React.useEffect(() => {
    if (!showImpulses || !data.traces.impulses || !Array.isArray(data.traces.impulses.x)) return;
    const xArr = data.traces.impulses.x as number[];
    const yArr = data.traces.impulses.y as number[];
    // Compute min/max for normalization
    const minStrength = Math.min(...yArr);
    const maxStrength = Math.max(...yArr);
    // Only trigger when moving forward
    if (playbackTime > lastCursorRef.current) {
      xArr.forEach((time, idx) => {
        const key = `${data.band.name}|${time}`;
        if (
          !emittedPulsesRef.current.has(key) &&
          time > lastCursorRef.current &&
          time <= playbackTime
        ) {
          console.log('[IMPULSE-REALTIME] emitPulse', { bandName: data.band.name, time, strength: yArr[idx] });
          emitPulse({ bandName: data.band.name, time: 500, strength: yArr[idx] });
          if (onImpulse) onImpulse(yArr[idx], minStrength, maxStrength, data.band.name, time);
          emittedPulsesRef.current.add(key);
        }
      });
    }
    lastCursorRef.current = playbackTime;
  }, [playbackTime, showImpulses, data.traces.impulses, data.band.name, emitPulse, onImpulse]);

  // Auto-scale y-axis based on visible magnitude data
  const yVals = data.traces.magnitude.y as number[];
  let yMin = Math.min(...yVals);
  let yMax = Math.max(...yVals);
  let margin = (yMax - yMin) * 0.1 || 1;
  yMin -= margin;
  yMax += margin;

  const traces = React.useMemo(() => [
    data.traces.magnitude,
    ...(showFirstDerivative ? [data.traces.derivative] : []),
    ...(showSecondDerivative ? [data.traces.secondDerivative] : []),
    ...(showImpulses ? [data.traces.impulses] : []),
    data.cursorTrace,
  ], [data, showFirstDerivative, showSecondDerivative, showImpulses]);

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
              legend: {
                orientation: 'h',
                y: -0.25,
                yanchor: 'top',
                x: 0.5,
                xanchor: 'center',
              },
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
  windowSec,
  followCursor,
  snapToWindow,
  showFirstDerivative,
  showSecondDerivative,
  showImpulses,
  selectedBand,
  onImpulse,
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
  const pausedAtRef = useRef<number>(0); // Where we paused

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

  // Show a message if there is no data to display
  if (bandPlotsData.length === 0 || bandPlotsData.every(b => !b.traces.magnitude.x || b.traces.magnitude.x.length === 0)) {
    return <Typography sx={{mt:2, textAlign:'center'}}>No data to display. Try loading and processing audio.</Typography>;
  }

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
      {/* Band plot list (no virtualization) */}
      {bandPlotsData
        .filter(data => data.band.name === selectedBand)
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
              playbackTime={playbackTime}
              onImpulse={onImpulse}
            />
          </Box>
        ))}
    </Box>
  );
};

export default AudioFrequencyVisualizer; 