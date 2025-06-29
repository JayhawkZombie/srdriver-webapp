import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useAppStore } from '../store/appStore';
import { getBandPlotData, BandPlotData } from './bandPlotUtils';
import { Box, Typography, Slider } from '@mui/material';

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

  if (!bandPlotData) return null;

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  );
});

export default BandPlot; 