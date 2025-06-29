import React, { useMemo, useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useAppStore } from '../store/appStore';
import { getBandPlotData, BandPlotData } from './bandPlotUtils';
import { Box, Typography, Slider } from '@mui/material';
import { useImpulseEvents } from '../context/ImpulseEventContext';

// Memoized BandPlot for a single band, optimized for Zustand and Plotly
const BandPlot: React.FC<{
  bandIdx: number;
  xRange: [number, number];
  playbackTime: number;
  isDark: boolean;
  axisColor: string;
  gridColor: string;
  plotBg: string;
}> = React.memo(({ bandIdx, xRange, playbackTime, isDark, axisColor, gridColor, plotBg }) => {
  // Select only the data needed for this band
  const bandDataArr = useAppStore(state => state.audioData.analysis?.bandDataArr || []);
  const normalizedImpulseThreshold = useAppStore(state => state.normalizedImpulseThreshold);
  const metadata = useAppStore(state => state.audioData.metadata);
  const hopSize = metadata && typeof metadata === 'object' && 'hopSize' in metadata ? (metadata as any).hopSize : 512;
  const sampleRate = metadata && typeof metadata === 'object' && 'sampleRate' in metadata ? (metadata as any).sampleRate : 44100;
  const freqs = useMemo(() => {
    const numBins = bandDataArr[bandIdx]?.magnitudes?.length || 0;
    return Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins));
  }, [bandDataArr, bandIdx, sampleRate]);
  const showFirstDerivative = useAppStore(state => state.showFirstDerivative);
  const showSecondDerivative = useAppStore(state => state.showSecondDerivative);
  const showImpulses = useAppStore(state => state.showImpulses);

  // Memoize plot data for this band
  const bandPlotData: BandPlotData | undefined = useMemo(() => {
    if (!bandDataArr[bandIdx]) return undefined;
    const arr = getBandPlotData({
      bandDataArr: [bandDataArr[bandIdx]],
      xRange,
      normalizedImpulseThreshold,
      playbackTime,
      isDark,
      hopSize,
      sampleRate,
      freqs,
      axisColor,
      gridColor,
      plotBg,
    });
    return arr[0];
  }, [bandDataArr, bandIdx, xRange, normalizedImpulseThreshold, playbackTime, isDark, hopSize, sampleRate, freqs, axisColor, gridColor, plotBg]);

  // Memoize traces for Plotly (always call hooks at top level)
  const traces = useMemo(() => bandPlotData ? [
    bandPlotData.traces.magnitude,
    ...(showFirstDerivative ? [bandPlotData.traces.derivative] : []),
    ...(showSecondDerivative ? [bandPlotData.traces.secondDerivative] : []),
    ...(showImpulses ? [bandPlotData.traces.impulses] : []),
    bandPlotData.cursorTrace,
  ] : [], [bandPlotData, showFirstDerivative, showSecondDerivative, showImpulses]);

  // Memoize layout for Plotly (always call hooks at top level)
  const layout = useMemo(() => ({
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
      range: bandPlotData?.yAxisRange, // Use fixed dB range if available
      automargin: true,
      titlefont: { size: 11 },
      tickfont: { size: 9 },
      color: axisColor,
      gridcolor: gridColor,
    },
    yaxis2: {
      title: 'Rate of Change (dB)',
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      zeroline: false,
      showticklabels: true,
      position: 1.0,
      color: axisColor,
    },
    yaxis3: {
      title: '2nd Derivative (dB)',
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      position: 0.98,
      color: 'cyan',
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
  }), [xRange, axisColor, gridColor, plotBg, bandPlotData?.yAxisRange]);

  const [showDetectionFunction, setShowDetectionFunction] = useState(false);
  const [showSustainedImpulses, setShowSustainedImpulses] = useState(false);
  const [onlySustained, setOnlySustained] = useState(false);

  // Detection function plot data (spectral-flux only)
  const detectionPlot = useMemo(() => {
    if (!bandPlotData || !bandPlotData.detectionFunction || !bandPlotData.thresholdArr) return null;
    // Downsample for performance if needed
    const step = Math.max(1, Math.floor(bandPlotData.detectionFunction.length / 1000));
    const times = bandPlotData.traces.magnitude.x as number[];
    const detection = bandPlotData.detectionFunction;
    const thresholdArr = bandPlotData.thresholdArr;
    // Use impulses from the impulse trace y values (if available)
    const impulses = bandPlotData.traces.impulses && Array.isArray(bandPlotData.traces.impulses.y) ? bandPlotData.traces.impulses.y as number[] : [];
    const sustained = bandPlotData.sustainedImpulses;
    const x = times.filter((_, i: number) => i % step === 0);
    const y = detection.filter((_, i: number) => i % step === 0);
    const th = thresholdArr.filter((_, i: number) => i % step === 0);
    // Impulse markers: find indices where impulses are nonzero
    const impulseIndices = impulses.map((v: number, i: number) => v > 0 ? i : -1).filter((i: number) => i >= 0);
    const sustainedIndices = sustained ? sustained.map((v: number, i: number) => v > 0 ? i : -1).filter((i: number) => i >= 0) : [];
    // Filtering logic
    const showImpulses = !onlySustained;
    const showSustained = showSustainedImpulses;
    return [
      { x, y, type: 'scatter', mode: 'lines', name: 'Detection Function', line: { color: 'orange', width: 2 } },
      { x, y: th, type: 'scatter', mode: 'lines', name: 'Threshold', line: { color: 'gray', width: 2, dash: 'dash' } },
      ...(showImpulses ? [{ x: impulseIndices.map((i: number) => times[i]), y: impulseIndices.map((i: number) => detection[i]), type: 'scatter', mode: 'markers', name: 'Impulses', marker: { color: 'red', size: 10, symbol: 'x' } }] : []),
      ...(showSustained && sustainedIndices.length > 0 ? [{ x: sustainedIndices.map((i: number) => times[i]), y: sustainedIndices.map((i: number) => detection[i]), type: 'scatter', mode: 'markers', name: 'Sustained', marker: { color: 'lime', size: 12, symbol: 'star' } }] : []),
    ];
  }, [bandPlotData, showSustainedImpulses, onlySustained]);

  const { emit } = useImpulseEvents();
  const emittedPulsesRef = React.useRef<Set<string>>(new Set());
  const lastCursorRef = React.useRef<number>(-Infinity);

  // Impulse event emission logic (moved from BandPlotCard)
  useEffect(() => {
    if (!bandPlotData || !showImpulses || !bandPlotData.traces.impulses || !Array.isArray(bandPlotData.traces.impulses.x)) return;
    const xArr = bandPlotData.traces.impulses.x as number[];
    const yArr = bandPlotData.traces.impulses.y as number[];
    const minStrength = Math.min(...yArr);
    const maxStrength = Math.max(...yArr);
    if (playbackTime > lastCursorRef.current) {
      xArr.forEach((time, idx) => {
        const key = `${bandPlotData.band.name}|${time}`;
        if (
          !emittedPulsesRef.current.has(key) &&
          time > lastCursorRef.current &&
          time <= playbackTime
        ) {
          emit({ strength: yArr[idx], min: minStrength, max: maxStrength, bandName: bandPlotData.band.name, time });
          emittedPulsesRef.current.add(key);
        }
      });
    }
    lastCursorRef.current = playbackTime;
  }, [playbackTime, showImpulses, bandPlotData, emit]);

  if (!bandPlotData) return null;

  return (
    <>
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      {/* Detection function plot toggle and plot (spectral-flux only) */}
      {bandPlotData && bandPlotData.detectionFunction && bandPlotData.thresholdArr && (
        <Box sx={{ mt: 1, mb: 0.5 }}>
          <label style={{ fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
            <input type="checkbox" checked={showDetectionFunction} onChange={e => setShowDetectionFunction(e.target.checked)} style={{ marginRight: 6 }} />
            Show Detection Function
          </label>
          <label style={{ fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
            <input type="checkbox" checked={showSustainedImpulses} onChange={e => setShowSustainedImpulses(e.target.checked)} style={{ marginRight: 6 }} />
            Show Sustained Impulses
          </label>
          <label style={{ fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={onlySustained} onChange={e => setOnlySustained(e.target.checked)} style={{ marginRight: 6 }} />
            Only Sustained
          </label>
          {showDetectionFunction && detectionPlot && (
            <Plot
              data={detectionPlot}
              layout={{
                height: 140,
                margin: { l: 40, r: 10, t: 10, b: 24 },
                xaxis: { title: 'Time (seconds)', color: axisColor, gridcolor: gridColor },
                yaxis: { title: 'Detection Value', color: axisColor, gridcolor: gridColor },
                paper_bgcolor: plotBg,
                plot_bgcolor: plotBg,
                legend: { orientation: 'h', y: -0.25, yanchor: 'top', x: 0.5, xanchor: 'center' },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          )}
        </Box>
      )}
    </>
  );
});

export default BandPlot; 