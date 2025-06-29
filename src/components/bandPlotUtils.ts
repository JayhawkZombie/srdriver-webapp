import { PlotData, PlotType, Dash } from 'plotly.js';

export interface BandData {
  band: { name: string; color: string };
  bandIdx: number;
  binIdx: number;
  magnitudes: number[];
  derivatives: number[];
  secondDerivatives: number[];
  impulseStrengths: number[];
  normalizedImpulseStrengths: number[];
  detectionFunction?: number[];
  threshold?: number[];
  sustainedImpulses?: number[];
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
  thresholdValue: number;
  freq: number;
  yAxisRange: [number, number];
  detectionFunction?: number[];
  thresholdArr?: number[];
  sustainedImpulses?: number[];
  magnitudes: number[];
}

interface GetBandPlotDataOptions {
  bandDataArr: BandData[];
  xRange: [number, number];
  playbackTime: number;
  isDark: boolean;
  hopSize: number;
  sampleRate: number;
  freqs: number[];
  axisColor: string;
  gridColor: string;
  plotBg: string;
  normalizedImpulseThreshold: number;
  impulseThresholds?: number[];
  setImpulseThresholds?: (thresholds: number[]) => void;
}

// UI scaling factor for impulse strengths (to make slider more user-friendly)
const IMPULSE_UI_SCALING = 1000;

function lightenColor(hex: string, amount = 0.5) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * amount);
  let g = ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * amount);
  let b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * amount);
  r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
  return `rgb(${r},${g},${b})`;
}

// Helper to clamp dB values
export function clampDB(m: number) {
  return Math.max(-80, Math.min(0, 20 * Math.log10(Math.max(m, 1e-6))));
}

// Helper to compute percentile
function percentile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
}

export function getBandPlotData({
  bandDataArr,
  xRange,
  playbackTime,
  isDark,
  hopSize,
  sampleRate,
  freqs,
  axisColor,
  gridColor,
  plotBg,
  normalizedImpulseThreshold,
  impulseThresholds,
  setImpulseThresholds,
}: GetBandPlotDataOptions): BandPlotData[] {
  // Compute static traces ONCE per band unless bandDataArr or display params change
  const staticTracesArr = bandDataArr.map((data: BandData) => {
    const { band, bandIdx, binIdx, magnitudes, derivatives, secondDerivatives, detectionFunction, threshold, sustainedImpulses } = data;
    const times = Array.from({ length: magnitudes.length }, (_, i) => (i * hopSize) / sampleRate);
    // Precompute all static traces for the full data
    return {
      band,
      bandIdx,
      binIdx,
      times,
      magnitudeTrace: {
        x: times,
        y: magnitudes.map(clampDB), // Clamp dB values
        type: 'scatter' as PlotType,
        mode: 'lines' as const,
        line: { color: band.color, width: 2 },
        name: band.name,
        yaxis: 'y', // Ensure on main axis
        visible: true,
      },
      derivativeTrace: {
        x: times,
        y: derivatives.map(clampDB), // Clamp dB values
        type: 'scatter' as PlotType,
        mode: 'lines' as const,
        line: { color: isDark ? lightenColor(band.color, 0.5) : 'rgba(255,0,255,0.5)', width: 3 },
        name: band.name + ' Rate of Change',
        yaxis: 'y2', // Ensure on secondary axis
        visible: true,
      },
      secondDerivativeTrace: {
        x: times,
        y: secondDerivatives.map(clampDB), // Clamp dB values
        type: 'scatter' as PlotType,
        mode: 'lines' as const,
        line: { color: 'cyan', width: 2 },
        name: band.name + ' 2nd Derivative',
        yaxis: 'y3',
      },
      magnitudes,
      derivatives,
      secondDerivatives,
      impulseStrengths: data.normalizedImpulseStrengths,
      detectionFunction,
      threshold,
      sustainedImpulses,
    };
  });

  // Now, for each band, compute the impulse trace only when threshold or xRange changes
  return staticTracesArr.map((staticData, bandIdx) => {
    const { band, binIdx, times, magnitudeTrace, derivativeTrace, secondDerivativeTrace, magnitudes, impulseStrengths, detectionFunction, threshold, sustainedImpulses } = staticData;
    const [xMin, xMax] = xRange;
    // Only show impulses in the visible window
    const visibleIndices = times.map((t, i) => (t >= xMin && t <= xMax ? i : -1)).filter(i => i >= 0);
    let thresholdValue = normalizedImpulseThreshold;
    // Only impulses above the normalized threshold are plotted
    const impulseIndices = visibleIndices.filter(i => impulseStrengths[i] > thresholdValue);
    const impulseTimes = impulseIndices.map(i => times[i]);
    const impulseValues = impulseIndices.map(i => magnitudes[i]);
    const impulseStrengthVals = impulseIndices.map(i => impulseStrengths[i]);
    const minStrength = Math.min(...impulseStrengthVals, 0);
    const maxStrength = Math.max(...impulseStrengthVals, 1);
    const normStrengths = impulseStrengthVals.map((s: number) => (s - minStrength) / (maxStrength - minStrength || 1));
    const impulseColors = normStrengths.map((t: number) => `hsl(${240 - 240 * t}, 100%, 50%)`);
    // Scale impulse strengths for UI
    const visibleImpulseStrengths = visibleIndices.map(i => impulseStrengths[i]);
    // Use percentiles for slider min/max
    let sliderMin = -1; // Allow for some negative outliers
    let sliderMax = 6; // 6 standard deviations above mean is very strong
    let sliderStep = Math.max((sliderMax - sliderMin) / 100, 0.001);
    // Clamp threshold to slider range
    let clampedThreshold = Math.max(sliderMin, Math.min(thresholdValue, sliderMax));
    if (impulseThresholds && setImpulseThresholds && thresholdValue !== clampedThreshold) {
      const newThresholds = [...impulseThresholds];
      newThresholds[bandIdx] = clampedThreshold;
      setImpulseThresholds(newThresholds);
      thresholdValue = clampedThreshold;
    }
    // Only the impulse trace is dynamic
    const impulsesTrace = {
      x: impulseTimes,
      y: impulseIndices.map(i => clampDB(magnitudes[i])), // Clamp dB values
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
      thresholdValue: normalizedImpulseThreshold,
      freq: freqs[binIdx],
      yAxisRange: [-80, 0],
      detectionFunction,
      thresholdArr: threshold,
      sustainedImpulses,
      magnitudes,
    };
  });
} 