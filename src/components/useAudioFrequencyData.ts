import { useState, useEffect, useMemo } from 'react';
import useBandPlots, { BandPlotData } from './useBandPlots';

export interface UseAudioFrequencyDataProps {
  fftSequence: (Float32Array | number[])[];
  sampleRate: number;
  hopSize: number;
  bands: { name: string; freq: number; color: string }[];
  playbackTime: number;
  windowSec: number;
  followCursor: boolean;
  snapToWindow: boolean;
  isDark: boolean;
  axisColor: string;
  gridColor: string;
  plotBg: string;
}

export interface UseAudioFrequencyDataResult {
  bandDataArr: any[];
  impulseThresholds: number[];
  setImpulseThresholds: (thresholds: number[]) => void;
  visualizing: boolean;
  visualizationStatus: string;
  xRange: [number, number];
  maxTime: number;
  freqs: number[];
}

const useAudioFrequencyData = (props: UseAudioFrequencyDataProps): UseAudioFrequencyDataResult => {
  const {
    fftSequence,
    sampleRate,
    hopSize,
    bands: bandsRaw,
    playbackTime,
    windowSec,
    followCursor,
    snapToWindow,
    isDark,
    axisColor,
    gridColor,
    plotBg,
  } = props;

  console.debug('[useAudioFrequencyData] Called', { fftSequenceLen: fftSequence.length, sampleRate, hopSize, bandsRaw });
  const bands = useMemo(() => {
    console.debug('[useAudioFrequencyData] bands memoized', bandsRaw);
    return bandsRaw;
  }, [bandsRaw]);
  const [bandDataArr, setBandDataArr] = useState<any[]>([]);
  const [visualizing, setVisualizing] = useState(false);
  const [visualizationStatus, setVisualizationStatus] = useState<string>('Preparing visualizations...');
  const [hasSetThresholds, setHasSetThresholds] = useState(false);
  const [impulseThresholds, setImpulseThresholds] = useState<number[]>(bands.map(() => 50));

  const numBins = fftSequence[0]?.length || 0;
  const times = useMemo(() => Array.from({ length: fftSequence.length }, (_, i) => (i * hopSize) / sampleRate), [fftSequence.length, hopSize, sampleRate]);
  const maxTime = times.length > 0 ? times[times.length - 1] : 0;
  const freqs = useMemo(() => Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins)), [numBins, sampleRate]);

  // xRange logic
  const xRange: [number, number] = useMemo(() => {
    if (!followCursor) {
      if (windowSec >= maxTime) {
        return [0, maxTime];
      } else {
        return [0, windowSec];
      }
    } else {
      if (windowSec >= maxTime) {
        return [0, maxTime];
      } else if (snapToWindow) {
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

  // Worker-based band data computation
  useEffect(() => {
    if (!fftSequence || fftSequence.length === 0) {
      setBandDataArr([]);
      return;
    }
    setVisualizing(true);
    setVisualizationStatus('Preparing visualizations...');
    setTimeout(() => {
      const worker = new Worker(new URL('../controllers/visualizationWorker.ts', import.meta.url));
      const fftSeqArr = fftSequence.map(row => Array.from(row));
      worker.onmessage = (e) => {
        if (e.data.status) {
          setVisualizationStatus(e.data.status);
        }
        setBandDataArr(e.data.bandDataArr);
        setVisualizing(false);
        console.debug('[useAudioFrequencyData] bandDataArr set from worker', e.data.bandDataArr);
      };
      setVisualizationStatus('Computing band data...');
      worker.postMessage({
        fftSequence: fftSeqArr,
        bands,
        sampleRate,
        hopSize,
      });
    }, 0);
  }, [fftSequence, sampleRate, hopSize, bands]);

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
  }, [bandDataArr, impulseThresholds]);

  return {
    bandDataArr,
    impulseThresholds,
    setImpulseThresholds,
    visualizing,
    visualizationStatus,
    xRange,
    maxTime,
    freqs,
  };
};

export default useAudioFrequencyData; 