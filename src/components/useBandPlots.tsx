import React, { useMemo } from 'react';
import { PlotData, PlotType, Dash } from 'plotly.js';

interface BandData {
  band: { name: string; color: string };
  bandIdx: number;
  binIdx: number;
  magnitudes: number[];
  derivatives: number[];
  secondDerivatives: number[];
  impulseStrengths: number[];
}

export interface BandPlotData {
  band: { name: string; color: string };
  bandIdx: number;
  binIdx: number;
  mainTraces: Partial<PlotData>[];
  traces: { [key: string]: Partial<PlotData> };
  cursorTrace: Partial<PlotData>;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  threshold: number;
  freq: number;
  // traces: { [key: string]: Partial<PlotData> }; // keep for internal use
}

interface UseBandPlotsProps {
  bandDataArr: BandData[];
  xRange: [number, number];
  impulseThresholds: number[];
  playbackTime: number;
  isDark: boolean;
  hopSize: number;
  sampleRate: number;
  freqs: number[];
  axisColor: string;
  gridColor: string;
  plotBg: string;
  setImpulseThresholds: (thresholds: number[]) => void;
}

function lightenColor(hex: string, amount = 0.5) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * amount);
  let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * amount);
  let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * amount);
  r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
  return `rgb(${r},${g},${b})`;
}

const useBandPlots = ({
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
}: UseBandPlotsProps): BandPlotData[] => {
  // Compute static traces ONCE per band unless bandDataArr or display params change
  const staticTracesArr = useMemo(() =>
    bandDataArr.map((data: BandData) => {
      const { band, bandIdx, binIdx, magnitudes, derivatives, secondDerivatives } = data;
      const times = Array.from({ length: magnitudes.length }, (_, i) => (i * hopSize) / sampleRate);
      // Precompute all static traces for the full data
      return {
        band,
        bandIdx,
        binIdx,
        times,
        magnitudeTrace: {
          x: times,
          y: magnitudes.map(m => 20 * Math.log10(m + 1e-6)),
          type: 'scatter' as PlotType,
          mode: 'lines' as const,
          line: { color: band.color, width: 2 },
          name: band.name,
        },
        derivativeTrace: {
          x: times,
          y: derivatives.map(m => 20 * Math.log10(Math.abs(m) + 1e-6)),
          type: 'scatter' as PlotType,
          mode: 'lines' as const,
          line: { color: isDark ? lightenColor(band.color, 0.5) : 'rgba(255,0,255,0.5)', width: 3 },
          name: band.name + ' Rate of Change',
          yaxis: 'y2',
        },
        secondDerivativeTrace: {
          x: times,
          y: secondDerivatives.map(m => 20 * Math.log10(Math.abs(m) + 1e-6)),
          type: 'scatter' as PlotType,
          mode: 'lines' as const,
          line: { color: 'cyan', width: 2 },
          name: band.name + ' 2nd Derivative',
          yaxis: 'y3',
        },
        magnitudes,
        derivatives,
        secondDerivatives,
        impulseStrengths: data.impulseStrengths,
      };
    }),
    [bandDataArr, hopSize, sampleRate, isDark]
  );

  // Now, for each band, compute the impulse trace only when threshold or xRange changes
  return staticTracesArr.map((staticData, bandIdx) => {
    const { band, binIdx, times, magnitudeTrace, derivativeTrace, secondDerivativeTrace, magnitudes, impulseStrengths } = staticData;
    const [xMin, xMax] = xRange;
    // Only show impulses in the visible window
    const visibleIndices = times.map((t, i) => (t >= xMin && t <= xMax ? i : -1)).filter(i => i >= 0);
    let threshold = impulseThresholds[bandIdx] ?? 50;
    // Compute impulse indices for visible window only
    const impulseIndices = visibleIndices.filter(i => impulseStrengths[i] > threshold);
    const impulseTimes = impulseIndices.map(i => times[i]);
    const impulseValues = impulseIndices.map(i => magnitudes[i]);
    const impulseStrengthVals = impulseIndices.map(i => impulseStrengths[i]);
    const minStrength = Math.min(...impulseStrengthVals, 0);
    const maxStrength = Math.max(...impulseStrengthVals, 1);
    const normStrengths = impulseStrengthVals.map((s: number) => (s - minStrength) / (maxStrength - minStrength || 1));
    const impulseColors = normStrengths.map((t: number) => `hsl(${240 - 240 * t}, 100%, 50%)`);
    // Slider range for impulses (visible window only)
    const visibleImpulseStrengths = visibleIndices.map(i => Math.abs(impulseStrengths[i]));
    const bandMin = Math.min(...visibleImpulseStrengths, 0);
    const bandMax = Math.max(...visibleImpulseStrengths, 1);
    let sliderMin = bandMin;
    let sliderMax = bandMax;
    if (sliderMax === sliderMin) sliderMax = sliderMin + 1;
    let sliderStep = Math.max((sliderMax - sliderMin) / 100, 0.001);
    if (threshold < sliderMin || threshold > sliderMax) {
      threshold = (sliderMin + sliderMax) / 2;
      const newThresholds = [...impulseThresholds];
      newThresholds[bandIdx] = threshold;
      setImpulseThresholds(newThresholds);
    }
    // Only the impulse trace is dynamic
    const impulsesTrace = {
      x: impulseTimes,
      y: impulseIndices.map(i => 20 * Math.log10(magnitudes[i] + 1e-6)),
      type: 'scatter' as PlotType,
      mode: 'markers' as const,
      marker: { color: impulseColors, size: 10, symbol: 'x' },
      name: band.name + ' Impulse',
    };
    // Compose the traces object for BandPlotCard
    const traces = {
      magnitude: magnitudeTrace,
      derivative: derivativeTrace,
      secondDerivative: secondDerivativeTrace,
      impulses: impulsesTrace,
    };
    return {
      band,
      bandIdx,
      binIdx,
      mainTraces: [magnitudeTrace, derivativeTrace, secondDerivativeTrace, impulsesTrace],
      traces,
      cursorTrace: {
        x: [playbackTime, playbackTime],
        y: [-10000, 10000],
        type: 'scatter' as PlotType,
        mode: 'lines' as const,
        line: { color: '#FFFFFF', width: 2, dash: 'solid' as Dash },
        name: 'Cursor',
        showlegend: false,
      },
      sliderMin,
      sliderMax,
      sliderStep,
      threshold,
      freq: freqs[binIdx],
    };
  });
};

export default useBandPlots; 