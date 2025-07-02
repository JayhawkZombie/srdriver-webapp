import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { set as idbSet, get as idbGet } from 'idb-keyval';

// --- Generic IndexedDB middleware ---
export function persistWithIndexedDB<T extends object>(key: string, config: StateCreator<T>): StateCreator<T> {
  return (set, _get, api) => {
    // Only hydrate if store is at initial state
    idbGet(key).then((stored: unknown) => {
      // Only hydrate if store is at initial state
      if (stored && typeof stored === 'object' && stored !== null) {
        const s = stored as Partial<AppState>;
        if (s.audioData) {
          set((state: T) => ({ ...state, audioData: s.audioData } as T));
        }
        if (s.devicesMetadata) {
          set((state: T) => ({ ...state, devicesMetadata: s.devicesMetadata } as T));
        }
      }
    });
    // Wrap set to persist to IndexedDB
    const setAndPersist: typeof set = (fnOrObj) => {
      set(fnOrObj);
      // Use type assertion to AppState for persisted fields
      const state = _get() as unknown as AppState;
      // Only persist serializable, minimal state
      const stateToPersist = {
        audioData: {
          metadata: state.audioData?.metadata ?? null,
          analysis: state.audioData?.analysis && state.audioData.analysis.summary
            ? { summary: state.audioData.analysis.summary }
            : null
        },
        devicesMetadata: state.devicesMetadata ?? {},
      };
      idbSet(key, stateToPersist);
    };
    return config(setAndPersist, _get, api);
  };
}

// --- Application-level Zustand store ---
export interface AudioDataMetadata {
  fileName: string;
  lastModified: number;
}

export interface AudioDataAnalysis {
  fftSequence: (Float32Array | number[])[];
  normalizedFftSequence?: number[][];
  summary: Record<string, unknown> | null;
  audioBuffer: AudioBuffer | null;
  bandDataArr?: Array<Record<string, unknown>>;
  impulseStrengths?: number[][];
  detectionFunction?: number[];
  detectionTimes?: number[];
}

export interface AudioDataState {
  metadata: AudioDataMetadata | null;
  analysis: AudioDataAnalysis | null;
}

export interface DeviceUIState {
  brightness: number;
  speed: number;
  patternIndex: number;
  bleRTT?: number; // BLE round-trip time in ms
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
  showSustainedImpulses: boolean;
  setShowSustainedImpulses: (show: boolean) => void;
  onlySustained: boolean;
  setOnlySustained: (show: boolean) => void;
  showDetectionFunction: boolean;
  setShowDetectionFunction: (show: boolean) => void;
  // New: UI and control state
  windowSize: number;
  setWindowSize: (n: number) => void;
  hopSize: number;
  setHopSize: (n: number) => void;
  followCursor: boolean;
  setFollowCursor: (b: boolean) => void;
  snapToWindow: boolean;
  setSnapToWindow: (b: boolean) => void;
  selectedEngine: string;
  setSelectedEngine: (s: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  audioUrl: string | undefined;
  setAudioUrl: (u: string | undefined) => void;
  isPlaying: boolean;
  setIsPlaying: (b: boolean) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
  processingProgress: { processed: number; total: number } | null;
  setProcessingProgress: (p: { processed: number; total: number } | null) => void;
  hasProcessedOnce: boolean;
  setHasProcessedOnce: (b: boolean) => void;
  isProcessingStale: boolean;
  setIsProcessingStale: (b: boolean) => void;
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
  impulseDetectionMode: 'second-derivative' | 'first-derivative' | 'z-score' | 'spectral-flux';
  setImpulseDetectionMode: (mode: 'second-derivative' | 'first-derivative' | 'z-score' | 'spectral-flux') => void;
  derivativeMode: 'forward' | 'centered' | 'moving-average';
  setDerivativeMode: (mode: 'forward' | 'centered' | 'moving-average') => void;
  spectralFluxWindow: number;
  setSpectralFluxWindow: (n: number) => void;
  spectralFluxK: number;
  setSpectralFluxK: (n: number) => void;
  spectralFluxMinSeparation: number;
  setSpectralFluxMinSeparation: (n: number) => void;
  // New: dB and dB delta thresholds for impulse detection
  minDb: number;
  setMinDb: (n: number) => void;
  minDbDelta: number;
  setMinDbDelta: (n: number) => void;
  // Pattern response
  patternResponseIndex: number;
  setPatternResponseIndex: (idx: number) => void;
  // Global selected device
  activeDeviceId: string | null;
  setActiveDeviceId: (id: string | null) => void;
  bleLookaheadMs: number;
  setBleLookaheadMs: (ms: number) => void;
  // New: Impulse Response
  impulseResponseAction: string;
  setImpulseResponseAction: (action: string) => void;
  impulseResponseArgs: string;
  setImpulseResponseArgs: (args: string) => void;
  minMagnitudeThreshold: number;
  setMinMagnitudeThreshold: (n: number) => void;
}

const initialAudioData: AudioDataState = {
  metadata: null,
  analysis: null,
};

const initialDevicesMetadata: { [macOrId: string]: { nickname: string } } = {};
const initialDevices: { [id: string]: DeviceUIState } = {};

// Private helper for safe device state updates
function safeUpdateDeviceState(prev: DeviceUIState, update: Partial<DeviceUIState>): DeviceUIState {
  return {
    ...prev,
    ...Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined)),
  };
}

// Private helper for safe device metadata updates
function safeUpdateDeviceMetadata(prev: { nickname: string } = { nickname: '' }, update: Partial<{ nickname: string }>): { nickname: string } {
  return {
    ...prev,
    ...Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined)),
  };
}

// Helper to update a single device by ID
function updateDeviceById(devices: { [id: string]: DeviceUIState }, id: string, update: Partial<DeviceUIState>): { [id: string]: DeviceUIState } {
  return {
    ...devices,
    [id]: safeUpdateDeviceState(devices[id], update),
  };
}

// Helper to update a single device's metadata by ID
function updateDeviceMetadataById(devicesMetadata: { [id: string]: { nickname: string } }, id: string, update: Partial<{ nickname: string }>): { [id: string]: { nickname: string } } {
  return {
    ...devicesMetadata,
    [id]: safeUpdateDeviceMetadata(devicesMetadata[id], update),
  };
}

export const useAppStore = create<AppState>(
  persistWithIndexedDB<AppState>('app-state', (set, get) => ({
    audioData: initialAudioData,
    setAudioData: (data: Partial<AudioDataState>) => set((state: AppState) => ({
      audioData: {
        ...state.audioData,
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
      },
    })),
    devicesMetadata: initialDevicesMetadata,
    setDeviceNickname: (macOrId: string, nickname: string) => set((state: AppState) => ({
      devicesMetadata: updateDeviceMetadataById(state.devicesMetadata, macOrId, { nickname }),
    })),
    devices: initialDevices,
    setDeviceState: (id: string, update: Partial<DeviceUIState>) => set((state: AppState) => ({
      devices: updateDeviceById(state.devices, id, update),
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
    showSustainedImpulses: false,
    setShowSustainedImpulses: (show) => set({ showSustainedImpulses: show }),
    onlySustained: false,
    setOnlySustained: (show) => set({ onlySustained: show }),
    showDetectionFunction: false,
    setShowDetectionFunction: (show) => set({ showDetectionFunction: show }),
    // New: UI and control state
    windowSize: 1024,
    setWindowSize: (n) => set({ windowSize: n }),
    hopSize: 512,
    setHopSize: (n) => set({ hopSize: n }),
    followCursor: true,
    setFollowCursor: (b) => set({ followCursor: b }),
    snapToWindow: true,
    setSnapToWindow: (b) => set({ snapToWindow: b }),
    selectedEngine: 'spectral-flux',
    setSelectedEngine: (s) => set({ selectedEngine: s }),
    file: null,
    setFile: (f) => set({ file: f }),
    audioUrl: undefined,
    setAudioUrl: (u) => set({ audioUrl: u }),
    isPlaying: false,
    setIsPlaying: (b) => set({ isPlaying: b }),
    loading: false,
    setLoading: (b) => set({ loading: b }),
    processingProgress: null,
    setProcessingProgress: (p) => set({ processingProgress: p }),
    hasProcessedOnce: false,
    setHasProcessedOnce: (b) => set({ hasProcessedOnce: b }),
    isProcessingStale: false,
    setIsProcessingStale: (b) => set({ isProcessingStale: b }),
    // Impulse controls (per band, default 5 bands)
    impulseThresholds: [50, 50, 50, 50, 50],
    setImpulseThresholds: (payload) => set(state => {
      if (Array.isArray(payload)) {
        return { impulseThresholds: payload };
      } else if (typeof payload === 'object' && payload.index !== undefined) {
        const arr: number[] = [...state.impulseThresholds];
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
    impulseDetectionMode: 'spectral-flux',
    setImpulseDetectionMode: (mode) => set({ impulseDetectionMode: mode }),
    derivativeMode: 'centered',
    setDerivativeMode: (mode) => set({ derivativeMode: mode }),
    spectralFluxWindow: 21,
    setSpectralFluxWindow: (n) => set({ spectralFluxWindow: n }),
    spectralFluxK: 2,
    setSpectralFluxK: (n) => set({ spectralFluxK: n }),
    spectralFluxMinSeparation: 3,
    setSpectralFluxMinSeparation: (n) => set({ spectralFluxMinSeparation: n }),
    // dB and dB delta thresholds for impulse detection
    minDb: -60,
    setMinDb: (n) => set({ minDb: n }),
    minDbDelta: 3,
    setMinDbDelta: (n) => set({ minDbDelta: n }),
    // Pattern response
    patternResponseIndex: 0,
    setPatternResponseIndex: (idx: number) => set({ patternResponseIndex: idx }),
    // Global selected device
    activeDeviceId: null,
    setActiveDeviceId: (id) => set({ activeDeviceId: id }),
    bleLookaheadMs: 150,
    setBleLookaheadMs: (ms: number) => set({ bleLookaheadMs: ms }),
    // New: Impulse Response
    impulseResponseAction: 'fire_pattern',
    setImpulseResponseAction: (action) => set({ impulseResponseAction: action }),
    impulseResponseArgs: '17-(255,255,255)-(0,0,0)',
    setImpulseResponseArgs: (args) => set({ impulseResponseArgs: args }),
    minMagnitudeThreshold: 1e-6,
    setMinMagnitudeThreshold: (n) => set({ minMagnitudeThreshold: n }),
  }))
); 