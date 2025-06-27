import React, { useMemo } from 'react';
import { PlotData } from 'plotly.js';

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
  traces: Partial<PlotData>[];
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  threshold: number;
  freq: number;
}

interface UseBandPlotsProps {
  bandDataArr: BandData[];
  xRange: [number, number];
  showFirstDerivative: boolean;
  showSecondDerivative: boolean;
  showImpulses: boolean;
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
}: UseBandPlotsProps): BandPlotData[] => {
  return useMemo(() => {
    return bandDataArr.map((data: BandData) => {
      const { band, bandIdx, binIdx, magnitudes, derivatives, secondDerivatives, impulseStrengths } = data;
      const times = Array.from({ length: magnitudes.length }, (_, i) => (i * hopSize) / sampleRate);
      const [xMin, xMax] = xRange;
      const visibleIndices = times.map((t, i) => (t >= xMin && t <= xMax ? i : -1)).filter(i => i >= 0);
      const visibleMagnitudes = visibleIndices.map(i => magnitudes[i]);
      const visibleDerivatives = visibleIndices.map(i => derivatives[i]);
      const visibleSecondDerivatives = visibleIndices.map(i => secondDerivatives[i]);
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
      const margin = (yMax - yMin) * 0.1 || 1;
      yMin -= margin;
      yMax += margin;
      const visibleImpulseStrengths = visibleSecondDerivatives.map(v => Math.abs(v));
      const bandMin = Math.min(...visibleImpulseStrengths, 0);
      const bandMax = Math.max(...visibleImpulseStrengths, 1);
      let sliderMin = bandMin;
      let sliderMax = bandMax;
      if (sliderMax === sliderMin) sliderMax = sliderMin + 1;
      let sliderStep = Math.max((sliderMax - sliderMin) / 100, 0.001);
      let threshold = impulseThresholds[bandIdx] ?? 50;
      if (threshold < sliderMin || threshold > sliderMax) {
        threshold = (sliderMin + sliderMax) / 2;
        const newThresholds = [...impulseThresholds];
        newThresholds[bandIdx] = threshold;
        setImpulseThresholds(newThresholds);
      }
      const impulseIndices = impulseStrengths
        .map((v: number, i: number) => (v > threshold ? i : -1))
        .filter((i: number) => i >= 0);
      const impulseTimes = impulseIndices.map((i: number) => times[i]);
      const impulseValues = impulseIndices.map((i: number) => magnitudes[i]);
      const impulseStrengthVals = impulseIndices.map((i: number) => impulseStrengths[i]);
      const minStrength = Math.min(...impulseStrengthVals, 0);
      const maxStrength = Math.max(...impulseStrengthVals, 1);
      const normStrengths = impulseStrengthVals.map((s: number) => (s - minStrength) / (maxStrength - minStrength || 1));
      const impulseColors = normStrengths.map((t: number) => `hsl(${240 - 240 * t}, 100%, 50%)`);
      const cursorTrace = {
        x: [playbackTime, playbackTime],
        y: [yMin, yMax],
        type: 'scatter',
        mode: 'lines',
        line: { color: 'red', width: 4, dash: 'solid' },
        name: 'Cursor',
        showlegend: false,
      };
      const traces: Partial<PlotData>[] = [
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
        } as Partial<PlotData>);
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
        } as Partial<PlotData>);
      }
      if (showImpulses && impulseTimes.length > 0) {
        traces.push({
          x: impulseTimes,
          y: impulseValues,
          type: 'scatter',
          mode: 'markers',
          marker: { color: impulseColors, size: 10, symbol: 'x' },
          name: band.name + ' Impulse',
        } as Partial<PlotData>);
      }
      traces.push(cursorTrace as Partial<PlotData>);
      return {
        band,
        bandIdx,
        binIdx,
        traces,
        sliderMin,
        sliderMax,
        sliderStep,
        threshold,
        freq: freqs[binIdx],
      };
    });
  }, [bandDataArr, xRange, showFirstDerivative, showSecondDerivative, showImpulses, impulseThresholds, playbackTime, isDark, hopSize, sampleRate, freqs, axisColor, gridColor, plotBg, setImpulseThresholds]);
};

export default useBandPlots; 