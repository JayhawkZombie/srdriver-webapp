import React, { useState, useEffect, useRef, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Box, Button, ButtonGroup, Checkbox, FormControlLabel, Slider, Typography, Select, MenuItem, FormGroup, Card, CardContent } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
  const STANDARD_BANDS = isDark ? DARK_BAND_COLORS : LIGHT_BAND_COLORS;

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
  const [showFirstDerivative, setShowFirstDerivative] = useState(true);
  const [showSecondDerivative, setShowSecondDerivative] = useState(false);
  const [showImpulses, setShowImpulses] = useState(false);
  // Per-band impulse thresholds
  const [impulseThresholds, setImpulseThresholds] = useState<number[]>(
    (isDark ? DARK_BAND_COLORS : LIGHT_BAND_COLORS).map(() => 50)
  ); // Default 50 for each band

  const playbackTime = externalPlaybackTime !== undefined ? externalPlaybackTime : internalPlaybackTime;
  const displaySequence = fftSequence;
  const numBins = displaySequence[0]?.length || 0;

  // X axis: time (seconds)
  const times = Array.from({ length: displaySequence.length }, (_, i) => (i * hopSize) / sampleRate);
  // Determine the max time
  const maxTime = times.length > 0 ? times[times.length - 1] : 0;
  // Window logic: useMemo to ensure xRange updates with playbackTime and controls
  const xRange: [number, number] = React.useMemo(() => {
    if (!followCursor) {
      // Show full song if windowSec >= maxTime, else show window from 0
      if (windowSec >= maxTime) {
        return [0, maxTime];
      } else {
        return [0, windowSec];
      }
    } else {
      // Follow cursor
      if (windowSec >= maxTime) {
        return [0, maxTime];
      } else if (snapToWindow) {
        // Snap to window: jump to next window when cursor passes window boundary
        const windowIdx = Math.floor(playbackTime / windowSec);
        let start = windowIdx * windowSec;
        let end = start + windowSec;
        if (end > maxTime) {
          end = maxTime;
          start = Math.max(0, end - windowSec);
        }
        return [start, end];
      } else if (playbackTime < windowSec / 2) {
        return [0, windowSec];
      } else if (playbackTime > maxTime - windowSec / 2) {
        return [maxTime - windowSec, maxTime];
      } else {
        return [playbackTime - windowSec / 2, playbackTime + windowSec / 2];
      }
    }
  }, [playbackTime, windowSec, snapToWindow, followCursor, maxTime]);
  // Frequency for each bin
  const freqs = Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins));

  // --- Audio playback logic ---
  // Clean up audio context and source
  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Start audio at a given offset
  const startAudio = (offset: number) => {
    if (!audioBuffer) return;
    stopAudio();
    const ctx = new window.AudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0, offset);
    audioContextRef.current = ctx;
    sourceNodeRef.current = source;
    playbackStartTimeRef.current = ctx.currentTime - offset;
    // When audio ends, pause
    source.onended = () => {
      setIsPlaying(false);
      setInternalPlaybackTime(maxTime);
      stopAudio();
    };
  };

  // Start/stop timer and audio
  useEffect(() => {
    if (isPlaying) {
      if (audioBuffer) {
        // Start audio playback
        startAudio(playbackTime);
        // Sync playbackTime to audio context
        intervalRef.current = setInterval(() => {
          const ctx = audioContextRef.current;
          if (ctx) {
            const t = ctx.currentTime - playbackStartTimeRef.current;
            setInternalPlaybackTime(t > maxTime ? maxTime : t);
            if (t >= maxTime) {
              setIsPlaying(false);
              stopAudio();
            }
          }
        }, 50);
      } else {
        // Fallback: timer only
        intervalRef.current = setInterval(() => {
          setInternalPlaybackTime((prev) => {
            const next = prev + 0.05 * playbackSpeed; // 50ms steps
            return next > maxTime ? maxTime : next;
          });
        }, 50);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopAudio();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAudio();
    };
    // eslint-disable-next-line
  }, [isPlaying, playbackSpeed, maxTime, audioBuffer]);

  // Reset playback if new data is loaded (only when fftSequence length goes from 0 to >0)
  useEffect(() => {
    if (fftSequence.length > 0) {
      setInternalPlaybackTime(0);
      setIsPlaying(false);
      pausedAtRef.current = 0;
      stopAudio();
    }
    // eslint-disable-next-line
  }, [fftSequence.length]);

  // Memoize all per-band calculations outside the map to avoid hook errors
  const bandDataArr = useMemo(() => {
    return STANDARD_BANDS.map((band: { name: string; freq: number; color: string }, bandIdx: number) => {
      // Find the bin closest to the band's frequency
      let binIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < freqs.length; i++) {
        const diff = Math.abs(freqs[i] - band.freq);
        if (diff < minDiff) {
          minDiff = diff;
          binIdx = i;
        }
      }
      const magnitudes = displaySequence.map(row => row[binIdx] ?? 0);
      const derivatives = magnitudes.map((v, i, arr) => i === 0 ? 0 : v - arr[i - 1]);
      const secondDerivatives = derivatives.map((v, i, arr) => i === 0 ? 0 : v - arr[i - 1]);
      const impulseStrengths = secondDerivatives.map((v) => Math.abs(v));
      // Find visible window for y-axis auto-fit
      const [xMin, xMax] = xRange;
      const visibleIndices = times.map((t, i) => (t >= xMin && t <= xMax ? i : -1)).filter(i => i >= 0);
      const visibleMagnitudes = visibleIndices.map(i => magnitudes[i]);
      const visibleDerivatives = visibleIndices.map(i => derivatives[i]);
      const visibleSecondDerivatives = visibleIndices.map(i => secondDerivatives[i]);
      // Find min/max for y-axis (add margin)
      let yMin = Math.min(...visibleMagnitudes);
      let yMax = Math.max(...visibleMagnitudes);
      if (showFirstDerivative) {
        yMin = Math.min(yMin, ...visibleDerivatives);
        yMax = Math.max(yMax, ...visibleDerivatives);
      }
      if (showSecondDerivative) {
        yMin = Math.min(yMin, ...visibleSecondDerivatives);
        yMax = Math.max(yMax, ...visibleSecondDerivatives);
      }
      // Add margin
      const margin = (yMax - yMin) * 0.1 || 1;
      yMin -= margin;
      yMax += margin;
      // --- Impulse threshold slider range/step logic ---
      // Use abs(secondDerivatives) for impulse strengths
      const visibleImpulseStrengths = visibleSecondDerivatives.map(v => Math.abs(v));
      const bandMin = Math.min(...visibleImpulseStrengths, 0);
      const bandMax = Math.max(...visibleImpulseStrengths, 1);
      let sliderMin = bandMin;
      let sliderMax = bandMax * 0.5;
      if (sliderMax === sliderMin) sliderMax = sliderMin + 1;
      // Use a finer step for small ranges
      let sliderStep = Math.max((sliderMax - sliderMin) / 100, 0.001);
      // Impulse detection for plotting
      const threshold = impulseThresholds[bandIdx] ?? 50;
      const impulseIndices = impulseStrengths
        .map((v, i) => (v > threshold ? i : -1))
        .filter(i => i > 0);
      // Impulse times, values, and strengths
      const impulseTimes = impulseIndices.map(i => times[i]);
      const impulseValues = impulseIndices.map(i => magnitudes[i]);
      const impulseStrengthVals = impulseIndices.map(i => impulseStrengths[i]);
      // Normalize strengths for color mapping
      const minStrength = Math.min(...impulseStrengthVals, 0);
      const maxStrength = Math.max(...impulseStrengthVals, 1);
      const normStrengths = impulseStrengthVals.map(s => (s - minStrength) / (maxStrength - minStrength || 1));
      // Map to color spectrum (blue to red)
      const impulseColors = normStrengths.map(t => `hsl(${240 - 240 * t}, 100%, 50%)`);
      return {
        band,
        bandIdx,
        binIdx,
        magnitudes,
        derivatives,
        secondDerivatives,
        impulseStrengths,
        visibleIndices,
        visibleMagnitudes,
        visibleDerivatives,
        visibleSecondDerivatives,
        yMin,
        yMax,
        sliderMin,
        sliderMax,
        sliderStep,
        impulseIndices,
        impulseTimes,
        impulseValues,
        impulseStrengthVals,
        impulseColors,
        normStrengths
      };
    });
  }, [displaySequence, freqs, xRange, showFirstDerivative, showSecondDerivative, impulseThresholds, times, numBins]);

  const bandPlots = useMemo(() => {
    return bandDataArr.map((data: any) => {
      const { band, bandIdx, binIdx, magnitudes, derivatives, secondDerivatives, yMin, yMax, sliderMin, sliderMax, sliderStep, impulseTimes, impulseValues, impulseColors } = data;
      // Cursor as a trace (vertical line)
      const cursorTrace = {
        x: [playbackTime, playbackTime],
        y: [yMin, yMax],
        type: 'scatter',
        mode: 'lines',
        line: { color: 'red', width: 4, dash: 'solid' },
        name: 'Cursor',
        showlegend: false,
      };
      // Traces array
      const traces: Partial<Plotly.PlotData>[] = [
        {
          x: times,
          y: magnitudes,
          type: 'scatter',
          mode: 'lines',
          line: { color: band.color, width: 2 },
          name: band.name,
        },
      ];
      if (showFirstDerivative) {
        const derivativeColor = isDark
          ? lightenColor(band.color, 0.5)
          : 'rgba(255,0,255,0.5)';
        traces.push({
          x: times,
          y: derivatives,
          type: 'scatter',
          mode: 'lines',
          line: { color: derivativeColor, width: 3 },
          name: band.name + ' Rate of Change',
          yaxis: 'y2',
        } as Partial<Plotly.PlotData>);
      }
      if (showSecondDerivative) {
        traces.push({
          x: times,
          y: secondDerivatives,
          type: 'scatter',
          mode: 'lines',
          line: { color: 'cyan', width: 2 },
          name: band.name + ' 2nd Derivative',
          yaxis: 'y3',
        } as Partial<Plotly.PlotData>);
      }
      if (showImpulses && impulseTimes.length > 0) {
        traces.push({
          x: impulseTimes,
          y: impulseValues,
          type: 'scatter',
          mode: 'markers',
          marker: { color: impulseColors, size: 10, symbol: 'x' },
          name: band.name + ' Impulse',
        } as Partial<Plotly.PlotData>);
      }
      traces.push(cursorTrace as Partial<Plotly.PlotData>);
      return (
        <Card key={band.name} sx={{ mb: 2, bgcolor: cardBg, boxShadow: 2, p: 0.5 }}>
          <CardContent sx={{ p: 1.2, pb: 1 }}>
            {/* Compact header: threshold slider to the left of the label */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1, overflow: 'visible' }}>
              {showImpulses && (
                <>
                  <Typography variant="body2" sx={{ color: band.color, minWidth: 60, fontWeight: 500, fontSize: 13 }}>
                    {band.name} Threshold:
                  </Typography>
                  <Slider
                    min={sliderMin}
                    max={sliderMax}
                    step={sliderStep}
                    value={impulseThresholds[bandIdx]}
                    onChange={(_, v) => {
                      const newThresholds = [...impulseThresholds];
                      newThresholds[bandIdx] = typeof v === 'number' ? v : (Array.isArray(v) ? v[0] : 0);
                      setImpulseThresholds(newThresholds);
                    }}
                    valueLabelDisplay="on"
                    valueLabelFormat={v => v.toFixed(1)}
                    size="small"
                    sx={{ width: 130, ml: 0, mr: 2 }}
                    marks={false}
                  />
                </>
              )}
              <div style={{ color: band.color, fontWeight: 700, fontSize: 16, margin: 0, lineHeight: 1 }}>{band.name} ({Math.round(freqs[binIdx])} Hz)</div>
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
                    title: 'Magnitude',
                    automargin: true,
                    range: [yMin, yMax],
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
  }, [bandDataArr, showFirstDerivative, showSecondDerivative, showImpulses, impulseThresholds, playbackTime, xRange, times, freqs, numBins, maxTime, cardBg, plotBg, axisColor, gridColor]);

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
    stopAudio();
  };
  const handleSpeedChange = (e: SelectChangeEvent<number>) => setPlaybackSpeed(Number(e.target.value));

  if (numBins === 0) return null;

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
        <ButtonGroup variant="contained" size="small">
          <Button onClick={handlePlay} disabled={isPlaying || playbackTime >= maxTime}>Play</Button>
          <Button onClick={handlePause} disabled={!isPlaying}>Pause</Button>
          <Button onClick={handleReset}>Reset</Button>
        </ButtonGroup>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Typography variant="body2">Speed:</Typography>
          <Select
            value={playbackSpeed}
            onChange={handleSpeedChange}
            size="small"
            sx={{ minWidth: 60 }}
          >
            <MenuItem value={0.5}>0.5x</MenuItem>
            <MenuItem value={1}>1x</MenuItem>
            <MenuItem value={2}>2x</MenuItem>
            <MenuItem value={4}>4x</MenuItem>
            <MenuItem value={8}>8x</MenuItem>
          </Select>
        </Box>
        <Typography variant="body2" sx={{ ml: 2 }}>
          Time: {playbackTime.toFixed(2)}s / {maxTime.toFixed(2)}s
        </Typography>
        <FormControlLabel
          control={<Checkbox checked={followCursor} onChange={e => setFollowCursor(e.target.checked)} />}
          label="Follow Cursor"
          sx={{ ml: 2 }}
        />
        <FormControlLabel
          control={<Checkbox checked={snapToWindow} onChange={e => setSnapToWindow(e.target.checked)} />}
          label="Snap to Window"
          sx={{ ml: 1 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, minWidth: 180 }}>
          <Typography variant="body2">Window Size:</Typography>
          <Slider
            min={2}
            max={Math.max(2, Math.ceil(maxTime))}
            value={windowSec}
            onChange={(_, v) => setWindowSec(Number(v))}
            valueLabelDisplay="auto"
            size="small"
            sx={{ width: 180 }}
          />
          <Typography variant="body2">{windowSec}s</Typography>
        </Box>
      </Box>
      {/* New: Derivative/Impulse toggles and threshold */}
      <FormGroup row sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={showFirstDerivative} onChange={e => setShowFirstDerivative(e.target.checked)} />}
          label="Show 1st Derivative"
        />
        <FormControlLabel
          control={<Checkbox checked={showSecondDerivative} onChange={e => setShowSecondDerivative(e.target.checked)} />}
          label="Show 2nd Derivative"
        />
        <FormControlLabel
          control={<Checkbox checked={showImpulses} onChange={e => setShowImpulses(e.target.checked)} />}
          label="Show Impulses"
        />
      </FormGroup>
      {bandPlots.length === 0 ? null : bandPlots}
    </Box>
  );
};

export default AudioFrequencyVisualizer; 