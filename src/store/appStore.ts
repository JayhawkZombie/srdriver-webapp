import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { set as idbSet, get as idbGet } from 'idb-keyval';

// --- Generic IndexedDB middleware ---
export function persistWithIndexedDB<T extends object>(key: string, config: StateCreator<T>): StateCreator<T> {
  return (set, get, api) => {
    // Only hydrate if store is at initial state
    idbGet(key).then((stored: any) => {
      const state = get();
      // Only hydrate if store is at initial state
      if (stored) {
        if (stored.audioData) {
          set((state: any) => ({ ...state, audioData: stored.audioData }));
        }
        if (stored.devicesMetadata) {
          set((state: any) => ({ ...state, devicesMetadata: stored.devicesMetadata }));
        }
      }
    });
    // Wrap set to persist to IndexedDB
    const setAndPersist: typeof set = (fnOrObj) => {
      set(fnOrObj);
      const state = get();
      // Only persist serializable, minimal state
      const stateToPersist = {
        audioData: {
          metadata: (state as any).audioData?.metadata ?? null,
          analysis: (state as any).audioData?.analysis && (state as any).audioData.analysis.summary
            ? { summary: (state as any).audioData.analysis.summary }
            : null
        },
        devicesMetadata: (state as any).devicesMetadata ?? {},
      };
      idbSet(key, stateToPersist);
    };
    return config(setAndPersist, get, api);
  };
}

// --- Application-level Zustand store ---
export interface AudioDataMetadata {
  fileName: string;
  lastModified: number;
}

export interface AudioDataAnalysis {
  fftSequence: (Float32Array | number[])[];
  summary: any;
  audioBuffer: any;
  bandDataArr?: any[];
  impulseStrengths?: number[][];
}

export interface AudioDataState {
  metadata: AudioDataMetadata | null;
  analysis: AudioDataAnalysis | null;
}

export interface DeviceUIState {
  brightness: number;
  speed: number;
  patternIndex: number;
}

export interface AppState {
  audioData: AudioDataState;
  setAudioData: (data: Partial<AudioDataState>) => void;
  devicesMetadata: { [macOrId: string]: { nickname: string } };
  setDeviceNickname: (macOrId: string, nickname: string) => void;
  devices: { [id: string]: DeviceUIState };
  setDeviceState: (id: string, update: Partial<DeviceUIState>) => void;
  // UI controls and toggles
  selectedBand: string;
  setSelectedBand: (band: string) => void;
  windowSec: number;
  setWindowSec: (sec: number) => void;
  showFirstDerivative: boolean;
  setShowFirstDerivative: (show: boolean) => void;
  showSecondDerivative: boolean;
  setShowSecondDerivative: (show: boolean) => void;
  showImpulses: boolean;
  setShowImpulses: (show: boolean) => void;
  // Impulse controls (per band)
  impulseThresholds: number[];
  setImpulseThresholds: (thresholds: number[] | { index: number, value: number }) => void;
  // Global normalized impulse threshold (in standard deviations)
  normalizedImpulseThreshold: number;
  setNormalizedImpulseThreshold: (value: number) => void;
  // Impulse/FFT processing controls
  impulseWindowSize: number; // How many frames apart for derivative (1 = current - prev)
  setImpulseWindowSize: (n: number) => void;
  impulseSmoothing: number; // Smoothing window for magnitude/derivative
  setImpulseSmoothing: (n: number) => void;
  impulseDetectionMode: 'second-derivative' | 'first-derivative' | 'z-score';
  setImpulseDetectionMode: (mode: 'second-derivative' | 'first-derivative' | 'z-score') => void;
  derivativeMode: 'forward' | 'centered' | 'moving-average';
  setDerivativeMode: (mode: 'forward' | 'centered' | 'moving-average') => void;
}

const initialAudioData: AudioDataState = {
  metadata: null,
  analysis: null,
};

const initialDevicesMetadata: { [macOrId: string]: { nickname: string } } = {};
const initialDevices: { [id: string]: DeviceUIState } = {};

export const useAppStore = create<AppState>(
  persistWithIndexedDB<AppState>('app-state', (set, get) => ({
    audioData: initialAudioData,
    setAudioData: (data) => set(state => ({ audioData: { ...state.audioData, ...data } })),
    devicesMetadata: initialDevicesMetadata,
    setDeviceNickname: (macOrId, nickname) => set(state => ({
      devicesMetadata: {
        ...state.devicesMetadata,
        [macOrId]: { nickname }
      }
    })),
    devices: initialDevices,
    setDeviceState: (id, update) => set(state => ({
      devices: {
        ...state.devices,
        [id]: { ...state.devices[id], ...update }
      }
    })),
    // UI controls and toggles
    selectedBand: 'Bass',
    setSelectedBand: (band) => set({ selectedBand: band }),
    windowSec: 4,
    setWindowSec: (sec) => set({ windowSec: sec }),
    showFirstDerivative: false,
    setShowFirstDerivative: (show) => set({ showFirstDerivative: show }),
    showSecondDerivative: false,
    setShowSecondDerivative: (show) => set({ showSecondDerivative: show }),
    showImpulses: true,
    setShowImpulses: (show) => set({ showImpulses: show }),
    // Impulse controls (per band, default 5 bands)
    impulseThresholds: [50, 50, 50, 50, 50],
    setImpulseThresholds: (payload) => set(state => {
      if (Array.isArray(payload)) {
        return { impulseThresholds: payload };
      } else if (typeof payload === 'object' && payload.index !== undefined) {
        const arr = [...state.impulseThresholds];
        arr[payload.index] = payload.value;
        return { impulseThresholds: arr };
      }
      return {};
    }),
    // Global normalized impulse threshold (in standard deviations)
    normalizedImpulseThreshold: 2.0,
    setNormalizedImpulseThreshold: (value: number) => set({ normalizedImpulseThreshold: value }),
    // Impulse/FFT processing controls
    impulseWindowSize: 1,
    setImpulseWindowSize: (n) => set({ impulseWindowSize: n }),
    impulseSmoothing: 1,
    setImpulseSmoothing: (n) => set({ impulseSmoothing: n }),
    impulseDetectionMode: 'second-derivative',
    setImpulseDetectionMode: (mode) => set({ impulseDetectionMode: mode }),
    derivativeMode: 'centered',
    setDerivativeMode: (mode) => set({ derivativeMode: mode }),
  }))
); 