import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Plot from 'react-plotly.js';
import { Box, Button, ButtonGroup, Checkbox, FormControlLabel, Slider, Typography, Select, MenuItem, FormGroup, Card, CardContent, Skeleton, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// @ts-ignore
import visualizationWorkerUrl from '../controllers/visualizationWorker.ts?worker';
import useBandPlots, { BandPlotData } from './useBandPlots';
import { FixedSizeList as List } from 'react-window';
import { UPlot } from 'react-uplot';
import uPlot from 'uplot';

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
}: {
  data: BandPlotData;
  xRange: [number, number];
  axisColor: string;
  gridColor: string;
  plotBg: string;
  showImpulses: boolean;
  impulseThresholds: number[];
  setImpulseThresholds: (thresholds: number[]) => void;
}) => (
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
          data={data.traces}
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
));

// New: uPlot-based band plot card
const BandUPlotCard = memo(({
  data,
  xRange,
  axisColor,
  gridColor,
  plotBg,
  showImpulses,
  impulseThresholds,
  setImpulseThresholds,
}: {
  data: BandPlotData;
  xRange: [number, number];
  axisColor: string;
  gridColor: string;
  plotBg: string;
  showImpulses: boolean;
  impulseThresholds: number[];
  setImpulseThresholds: (thresholds: number[]) => void;
}) => {
  // Responsive container
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [plotSize, setPlotSize] = React.useState({ width: 600, height: 280 });
  React.useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPlotSize({
          width: Math.max(300, Math.floor(rect.width)),
          height: Math.max(200, Math.floor(rect.height)),
        });
      }
    };
    handleResize();
    const ro = new window.ResizeObserver(handleResize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Prepare uPlot data and series for shared-x mode (main trace always shown, overlays use 0 for missing values)
  const mainTrace = data.traces[0];
  const xArr = (mainTrace.x as number[]) || [];
  const uData: Float64Array[] = [new Float64Array(xArr)];
  const series: any[] = [
    {}, // x
    {
      label: data.band.name,
      stroke: data.band.color,
      width: 2,
    },
  ];
  // Main y
  uData.push(new Float64Array((mainTrace.y as number[]) || []));
  // Overlay traces (derivatives, impulses, cursor)
  for (let i = 1; i < data.traces.length; ++i) {
    const t = data.traces[i];
    // Build y array of same length as xArr, fill with 0 except at matching x
    const yArr = new Array(xArr.length).fill(0);
    if (t.x && t.y && Array.isArray(t.x) && Array.isArray(t.y)) {
      (t.x as number[]).forEach((tx, idx) => {
        const xi = xArr.findIndex(xx => Math.abs(xx - tx) < 1e-6);
        if (xi !== -1) yArr[xi] = (t.y as number[])[idx];
      });
    }
    uData.push(new Float64Array(yArr));
    let color: string = 'gray', width = 2, dash: number[] | undefined = undefined, points: { size: number; fill: string; stroke: string } | undefined = undefined;
    if (t.line && t.line.color) color = t.line.color as string || 'gray';
    if (t.line && t.line.width) width = t.line.width as number;
    if (t.line && t.line.dash === 'solid') dash = undefined;
    if (t.line && t.line.dash === 'dot') dash = [2, 4];
    if (t.marker && t.marker.size) points = { size: t.marker.size as number, fill: color, stroke: color };
    if (t.mode === 'markers') points = { size: 8, fill: color, stroke: color };
    if (t.marker && t.marker.color) {
      if (Array.isArray(t.marker.color)) {
        const colorArr = t.marker.color as unknown[];
        const firstString = colorArr.find((c) => typeof c === 'string') as string | undefined;
        color = firstString || color;
      } else if (typeof t.marker.color === 'string') {
        color = t.marker.color;
      }
    }
    series.push({
      label: t.name || `Series ${i}`,
      stroke: color,
      width,
      dash,
      points,
      spanGaps: true,
      pxAlign: 1,
      paths: t.mode === 'markers' ? uPlot.paths.points : uPlot.paths.linear,
    });
  }
  const validData = uData.length > 1 && uData[1].length > 0;
  // uPlot options
  const options: uPlot.Options = {
    width: plotSize.width,
    height: plotSize.height,
    title: data.band.name + ` (${Math.round(data.freq)} Hz)`,
    scales: {
      x: { time: false, min: xRange[0], max: xRange[1] },
      y: { auto: true },
    },
    axes: [
      {
        stroke: axisColor,
        grid: { stroke: gridColor },
        label: 'Time (seconds)',
      },
      {
        stroke: axisColor,
        grid: { stroke: gridColor },
        label: 'Magnitude',
      },
    ],
    series,
    hooks: {},
  };
  return (
    <Card sx={{ mb: 2, bgcolor: data.band.color + '10', boxShadow: 2, p: 0.5 }}>
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
        <Box ref={containerRef} sx={{ width: '100%', height: 320, p: 0.5, pt: 0, pb: 0, boxSizing: 'border-box' }}>
          {validData ? (
            (() => {
              try {
                return <UPlot options={options} data={uData} />;
              } catch (err) {
                console.error('UPlot render error:', err, { uData, options });
                return <Typography color="error">Plot error: {String(err)}</Typography>;
              }
            })()
          ) : (
            <Typography color="error">No data to plot</Typography>
          )}
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
  const [showFirstDerivative, setShowFirstDerivative] = useState(false);
  const [showSecondDerivative, setShowSecondDerivative] = useState(false);
  const [showImpulses, setShowImpulses] = useState(true);
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

  const [bandDataArr, setBandDataArr] = useState<any[]>([]); // Precomputed per-band data
  const [visualizing, setVisualizing] = useState(false); // Optional: show spinner while worker runs
  const [hasSetThresholds, setHasSetThresholds] = useState(false); // Track if thresholds have been set for current data
  // Visualization status message
  const [visualizationStatus, setVisualizationStatus] = useState<string>('Preparing visualizations...');

  // --- Profiling state ---
  // const [renderCount, setRenderCount] = useState(0);
  // const [lastRenderDuration, setLastRenderDuration] = useState(0);
  // const bandPlotsRenderCount = useRef(0);
  // const bandPlotsLastDuration = useRef(0);

  // Precompute all band data in a worker when fftSequence or bands/colors change
  useEffect(() => {
    if (!fftSequence || fftSequence.length === 0) {
      setBandDataArr([]);
      return;
    }
    setVisualizing(true);
    setVisualizationStatus('Preparing visualizations...');
    const worker = new Worker(new URL('../controllers/visualizationWorker.ts', import.meta.url));
    // Convert Float32Array[] to number[][] for transfer
    const fftSeqArr = fftSequence.map(row => Array.from(row));
    worker.onmessage = (e) => {
      if (e.data.status) {
        setVisualizationStatus(e.data.status);
      }
      setBandDataArr(e.data.bandDataArr);
      setVisualizing(false);
    };
    setVisualizationStatus('Computing band data...');
    worker.postMessage({
      fftSequence: fftSeqArr,
      bands: STANDARD_BANDS,
      sampleRate,
      hopSize,
    });
    return () => worker.terminate();
    // eslint-disable-next-line
  }, [fftSequence, sampleRate, hopSize, isDark]);

  // When bandDataArr changes, reset hasSetThresholds
  useEffect(() => {
    setHasSetThresholds(false);
  }, [bandDataArr]);

  // When showImpulses is toggled on, set thresholds to middle of slider range for each band, but only once per data load
  useEffect(() => {
    if (bandDataArr.length > 0 && !hasSetThresholds) {
      setImpulseThresholds(bandDataArr.map(band => {
        const visibleImpulseStrengths = band.impulseStrengths.map((v: number) => Math.abs(v));
        const bandMin = Math.min(...visibleImpulseStrengths, 0);
        const bandMax = Math.max(...visibleImpulseStrengths, 1);
        let sliderMin = bandMin;
        let sliderMax = bandMax;
        if (sliderMax === sliderMin) sliderMax = sliderMin + 1;
        return (sliderMin + sliderMax) / 2;
      }));
      setHasSetThresholds(true);
    }
  }, [bandDataArr, hasSetThresholds]);

  // Clamp impulseThresholds to visible slider range for each band
  useEffect(() => {
    if (!bandDataArr.length) return;
    const newThresholds = bandDataArr.map((data, bandIdx) => {
      const visibleSecondDerivatives = data.secondDerivatives as number[];
      const visibleImpulseStrengths = visibleSecondDerivatives.map((v) => Math.abs(v));
      const bandMin = Math.min(...visibleImpulseStrengths, 0);
      const bandMax = Math.max(...visibleImpulseStrengths, 1);
      let sliderMin = bandMin;
      let sliderMax = bandMax;
      if (sliderMax === sliderMin) sliderMax = sliderMin + 1;
      let threshold = impulseThresholds[bandIdx] ?? 50;
      if (threshold < sliderMin || threshold > sliderMax) {
        threshold = (sliderMin + sliderMax) / 2;
      }
      return threshold;
    });
    if (JSON.stringify(newThresholds) !== JSON.stringify(impulseThresholds)) {
      setImpulseThresholds(newThresholds);
    }
    // Only run when bandDataArr or impulseThresholds changes
  }, [bandDataArr, impulseThresholds]);

  // --- Memoized bandPlots ---
  const bandPlotsData = useBandPlots({
    bandDataArr,
    xRange,
    showFirstDerivative,
    showSecondDerivative,
    showImpulses,
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

  // Track overall render count and duration
  // useEffect(() => {
  //   const t0 = performance.now();
  //   setRenderCount(c => c + 1);
  //   setLastRenderDuration(performance.now() - t0);
  // });

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

  // --- Band selection state ---
  const [selectedBands, setSelectedBands] = useState<string[]>([]);
  useEffect(() => {
    if (bandPlotsData.length > 0 && selectedBands.length === 0) {
      setSelectedBands([bandPlotsData[0].band.name]);
    }
  }, [bandPlotsData]);

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
      {/* New: Band selection toggle */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={selectedBands[0] || ''}
          exclusive
          onChange={(_, newBand) => {
            if (newBand) setSelectedBands([newBand]);
          }}
          aria-label="Band selection"
        >
          {bandPlotsData.map(data => (
            <ToggleButton key={data.band.name} value={data.band.name} aria-label={data.band.name}>
              {data.band.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      {/* Band plot list (no virtualization) */}
      {bandPlotsData.map(data => (
        <Box
          key={data.band.name}
          sx={{ display: selectedBands.includes(data.band.name) ? 'block' : 'none' }}
        >
          <BandUPlotCard
            data={data}
            xRange={xRange}
            axisColor={axisColor}
            gridColor={gridColor}
            plotBg={plotBg}
            showImpulses={showImpulses}
            impulseThresholds={impulseThresholds}
            setImpulseThresholds={setImpulseThresholds}
          />
        </Box>
      ))}
    </Box>
  );
};

export default AudioFrequencyVisualizer; 