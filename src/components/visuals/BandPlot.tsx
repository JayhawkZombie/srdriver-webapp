import React, { useMemo, useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { useAppStore } from '../../store/appStore';
import { getBandPlotData, type BandPlotData, clampDB, type BandData } from './bandPlotUtils';

// Memoized BandPlot for a single band, optimized for Zustand and Plotly
const BandPlot: React.FC<{
  bandIdx: number;
  xRange: [number, number];
  playbackTime: number;
  isDark: boolean;
  axisColor: string;
  gridColor: string;
  plotBg: string;
  detectionFunction?: number[];
  detectionTimes?: number[];
}> = React.memo(({ bandIdx, xRange, playbackTime, isDark, axisColor, gridColor, plotBg, detectionFunction, detectionTimes }) => {
  // Read toggles directly from global state
  const showSustainedImpulses = useAppStore(state => state.showSustainedImpulses);
  const onlySustained = useAppStore(state => state.onlySustained);
  const showDetectionFunction = useAppStore(state => state.showDetectionFunction);
  // Debug log for toggle props
  console.log('BandPlot toggles:', { showSustainedImpulses, onlySustained, showDetectionFunction });

  // Safely extract bandDataArr as BandData[] if possible, else use []
  const rawBandDataArr = useAppStore(state => state.audioData.analysis?.bandDataArr ?? []);
  // Type guard for BandData
  function isBandData(obj: unknown): obj is BandData {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'band' in obj &&
      'magnitudes' in obj &&
      'derivatives' in obj
    );
  }
  const bandDataArr: BandData[] = Array.isArray(rawBandDataArr) ? (rawBandDataArr as unknown[]).filter(isBandData) : [];
  const normalizedImpulseThreshold = useAppStore(state => state.normalizedImpulseThreshold);
  // Always use global hopSize/sampleRate
  const globalHopSize = useAppStore(state => state.hopSize);
  const globalSampleRate = useAppStore(state => state.audioData.analysis?.audioBuffer?.sampleRate ?? 44100);
  const hopSize = globalHopSize;
  const sampleRate = globalSampleRate;
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

  // Debug log for sustainedImpulses
  console.log('sustainedImpulses (first 20):', bandPlotData?.sustainedImpulses?.slice(0, 20));

  const isPlaying = useAppStore(state => state.isPlaying);
  // Smooth cursor animation
  const [displayedCursorTime, setDisplayedCursorTime] = useState(playbackTime);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setDisplayedCursorTime(playbackTime);
      return;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const animate = () => {
      setDisplayedCursorTime(prev => {
        const delta = playbackTime - prev;
        if (Math.abs(delta) < 0.01) return playbackTime;
        return prev + delta * 0.2;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playbackTime, isPlaying]);

  // Memoize traces for Plotly (always call hooks at top level)
  const traces = useMemo(() => {
    if (!bandPlotData) return [];
    const baseTraces = [
      bandPlotData.traces.magnitude,
      ...(showFirstDerivative ? [bandPlotData.traces.derivative] : []),
      ...(showSecondDerivative ? [bandPlotData.traces.secondDerivative] : []),
      // Impulse marker logic:
      ...(() => {
        const times = (bandPlotData.traces.magnitude.x as number[]);
        const magnitudes = bandPlotData.magnitudes;
        const sustained = bandPlotData.sustainedImpulses;
        const sustainedIndices = sustained ? sustained.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0) : [];
        const sustainedTrace = {
          x: sustainedIndices.map(i => times[i]),
          y: sustainedIndices.map(i => clampDB(magnitudes[i])),
          type: 'scatter',
          mode: 'markers',
          name: bandPlotData.band.name + ' Sustained',
          marker: { color: 'lime', size: 12, symbol: 'star' },
        };
        if (onlySustained && sustained && sustainedIndices.length > 0) {
          // Only show sustained impulses
          return [sustainedTrace];
        } else if (showSustainedImpulses && sustained && sustainedIndices.length > 0) {
          // Show both regular and sustained impulses
          return [bandPlotData.traces.impulses, sustainedTrace];
        } else {
          // Only show regular impulses
          return showImpulses ? [bandPlotData.traces.impulses] : [];
        }
      })(),
      // Use displayedCursorTime for the cursor trace
      {
        x: [displayedCursorTime, displayedCursorTime],
        y: [-10000, 10000],
        type: 'scatter',
        mode: 'lines',
        line: { color: '#FFFFFF', width: 2, dash: 'solid' },
        name: 'Cursor',
        showlegend: false,
      },
    ];
    // Overlay detection function as a trace with yaxis: 'y2'
    if (showDetectionFunction && detectionFunction && detectionTimes && detectionFunction.length > 0 && detectionTimes.length > 0) {
      console.log('Detection Function trace:', {
        showDetectionFunction,
        detectionFunction: detectionFunction.slice(0, 10),
        detectionTimes: detectionTimes.slice(0, 10),
        length: detectionFunction.length
      });
      baseTraces.push({
        x: detectionTimes,
        y: detectionFunction,
        type: 'scatter',
        mode: 'lines',
        name: 'Detection Function',
        line: { color: 'orange', width: 2 },
        yaxis: 'y2',
      });
    }
    return baseTraces.flat();
  }, [bandPlotData, showFirstDerivative, showSecondDerivative, showImpulses, showDetectionFunction, detectionFunction, detectionTimes, showSustainedImpulses, onlySustained, displayedCursorTime]);

  // Memoize layout for Plotly (always call hooks at top level)
  const layout = useMemo(() => ({
    height: 280,
    margin: { l: 40, r: 40, t: 10, b: 24 },
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
      title: 'Detection Function',
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      zeroline: false,
      showticklabels: true,
      position: 1.0,
      color: 'orange',
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