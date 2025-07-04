import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { set as idbSet, get as idbGet } from 'idb-keyval';

// --- Generic IndexedDB middleware ---
export function persistWithIndexedDB<T extends object>(key: string, config: StateCreator<T>): StateCreator<T> {
  return (set, _get, api) => {
    idbGet(key).then((stored: unknown) => {
      if (stored && typeof stored === 'object' && stored !== null) {
        const s = stored as Partial<AppState>;
        if (s.audio) {
          set((state: T) => ({ ...state, audio: s.audio } as T));
        }
        if (s.ui) {
          set((state: T) => ({ ...state, ui: s.ui } as T));
        }
        if (s.playback) {
          set((state: T) => ({ ...state, playback: s.playback } as T));
        }
      }
    });
    const setAndPersist: typeof set = (fnOrObj) => {
      set(fnOrObj);
      const state = _get() as unknown as AppState;
      // Deep clone and remove audioBuffer before persisting
      const stateToPersist = {
        audio: {
          ...state.audio,
          analysis: {
            ...state.audio.analysis,
            audioBuffer: null, // Do not persist AudioBuffer
          },
        },
        playback: state.playback,
        ui: state.ui,
      };
      idbSet(key, stateToPersist);
    };
    return config(setAndPersist, _get, api);
  };
}

// --- Timeline types ---
export interface TimelineResponse {
  id: string;
  timestamp: number;
  duration: number;
  trackIndex: number;
  data: Record<string, any>;
  triggered: boolean;
  intent?: string; // e.g., 'primary', 'error', 'success', etc.
}

// --- Grouped Zustand store ---
export interface AudioDataMetadata {
  fileName: string;
  lastModified: number;
}

export interface AudioDataAnalysis {
  fftSequence: (Float32Array | number[]);
  normalizedFftSequence?: number[][];
  summary: Record<string, unknown> | null;
  bandDataArr?: Array<Record<string, unknown>>;
  impulseStrengths?: number[][];
  detectionFunction?: number[];
  detectionTimes?: number[];
  waveform?: number[];
  duration?: number;
  barData?: number[];
}

export interface AudioDataState {
  metadata: AudioDataMetadata | null;
  analysis: AudioDataAnalysis | null;
}

export interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  totalDuration: number;
}

export interface UIState {
  windowSec: number;
  showFirstDerivative: boolean;
  showSecondDerivative: boolean;
  showImpulses: boolean;
  showSustainedImpulses: boolean;
  onlySustained: boolean;
  showDetectionFunction: boolean;
  // Add more UI controls as needed
}

// --- Device types ---
export type DeviceTypeInfo = {
  model: string;
  firmwareVersion: string;
  numLEDs: number;
  ledLayout: 'strip' | 'matrix' | 'custom';
  capabilities: string[];
};

export type DeviceMetadata = {
  id: string;
  macOrId: string;
  nickname: string;
  name: string;
  group: string | null;
  tags: string[];
  typeInfo: DeviceTypeInfo;
};

export type DeviceUIState = {
  brightness: number;
  speed: number;
  patternIndex: number;
};

export type DeviceConnectionStatus = {
  isConnected: boolean;
  isConnecting: boolean;
  lastHeartbeat: number | null;
  bleRTT: number | null;
  error: string | null;
  lastSeen: number | null;
  autoReconnect: boolean;
};

export type DeviceDataBlob = {
  [key: string]: any;
};

export type DeviceUserPrefs = {
  [id: string]: {
    autoReconnect?: boolean;
    preferredGroup?: string;
    // Extend as needed
  };
};

// --- AppState ---
export interface AppState {
  audio: {
    data: AudioDataState;
    analysis: AudioDataAnalysis;
  };
  playback: PlaybackState;
  ui: UIState;
  timeline: {
    responses: TimelineResponse[];
  };
  devices: string[];
  deviceMetadata: { [id: string]: DeviceMetadata };
  deviceState: { [id: string]: DeviceUIState };
  deviceConnection: { [id: string]: DeviceConnectionStatus };
  deviceData: { [id: string]: DeviceDataBlob };
  deviceUserPrefs: DeviceUserPrefs;
  // Add other groups as needed
}

// --- Initial state ---
const initialAudioData: AudioDataState = {
  metadata: null,
  analysis: null,
};
const initialAudioAnalysis: AudioDataAnalysis = {
  fftSequence: [],
  summary: null,
};
const initialPlayback: PlaybackState = {
  currentTime: 0,
  isPlaying: false,
  totalDuration: 0,
};
const initialUI: UIState = {
  windowSec: 4,
  showFirstDerivative: false,
  showSecondDerivative: false,
  showImpulses: true,
  showSustainedImpulses: false,
  onlySustained: false,
  showDetectionFunction: false,
};
const initialTimeline = {
  responses: [],
};
const initialDeviceMetadata: { [id: string]: DeviceMetadata } = {};
const initialDeviceState: { [id: string]: DeviceUIState } = {};
const initialDeviceConnection: { [id: string]: DeviceConnectionStatus } = {};
const initialDeviceData: { [id: string]: DeviceDataBlob } = {};
const initialDeviceUserPrefs: DeviceUserPrefs = {};

export const useAppStore = create<AppState & {
  setAudioData: (data: { waveform: number[]; duration: number }) => void;
  addTimelineResponse: (resp: TimelineResponse) => void;
  updateTimelineResponse: (id: string, update: Partial<TimelineResponse>) => void;
  deleteTimelineResponse: (id: string) => void;
  setTimelineResponses: (responses: TimelineResponse[]) => void;
  addDevice: (metadata: DeviceMetadata) => void;
  removeDevice: (id: string) => void;
  setDeviceMetadata: (id: string, metadata: DeviceMetadata) => void;
  setDeviceState: (id: string, state: Partial<DeviceUIState>) => void;
  setDeviceConnection: (id: string, status: Partial<DeviceConnectionStatus>) => void;
  setDeviceData: (id: string, data: DeviceDataBlob) => void;
  updateDeviceTypeInfo: (id: string, typeInfo: Partial<DeviceTypeInfo>) => void;
  setDeviceGroup: (id: string, group: string | null) => void;
  setDeviceUserPrefs: (id: string, prefs: Partial<DeviceUserPrefs[string]>) => void;
}>(
  persistWithIndexedDB('app-state', (set, get) => ({
    audio: {
      data: initialAudioData,
      analysis: initialAudioAnalysis,
    },
    playback: initialPlayback,
    ui: initialUI,
    timeline: initialTimeline,
    devices: [],
    deviceMetadata: initialDeviceMetadata,
    deviceState: initialDeviceState,
    deviceConnection: initialDeviceConnection,
    deviceData: initialDeviceData,
    deviceUserPrefs: initialDeviceUserPrefs,
    setAudioData: ({ waveform, duration }) => {
      set((state) => ({
        audio: {
          ...state.audio,
          analysis: {
            ...state.audio.analysis,
            waveform,
            duration,
          },
        },
        playback: {
          ...state.playback,
          totalDuration: duration,
        },
      }));
    },
    addTimelineResponse: (resp) => set(state => ({
      timeline: {
        ...state.timeline,
        responses: [...state.timeline.responses, resp],
      },
    })),
    updateTimelineResponse: (id, update) => set(state => ({
      timeline: {
        ...state.timeline,
        responses: state.timeline.responses.map(r => r.id === id ? { ...r, ...update } : r),
      },
    })),
    deleteTimelineResponse: (id) => set(state => ({
      timeline: {
        ...state.timeline,
        responses: state.timeline.responses.filter(r => r.id !== id),
      },
    })),
    setTimelineResponses: (responses) => set(state => ({
      timeline: {
        ...state.timeline,
        responses,
      },
    })),
    addDevice: (metadata) => set(state => ({
      devices: [...state.devices, metadata.id],
      deviceMetadata: { ...state.deviceMetadata, [metadata.id]: metadata },
    })),
    removeDevice: (id) => set(state => {
      const { [id]: _, ...restMeta } = state.deviceMetadata;
      const { [id]: __, ...restState } = state.deviceState;
      const { [id]: ___, ...restConn } = state.deviceConnection;
      const { [id]: ____, ...restData } = state.deviceData;
      const { [id]: _____, ...restPrefs } = state.deviceUserPrefs;
      return {
        devices: state.devices.filter(did => did !== id),
        deviceMetadata: restMeta,
        deviceState: restState,
        deviceConnection: restConn,
        deviceData: restData,
        deviceUserPrefs: restPrefs,
      };
    }),
    setDeviceMetadata: (id, metadata) => set(state => ({
      deviceMetadata: { ...state.deviceMetadata, [id]: metadata },
    })),
    setDeviceState: (id, update) => set(state => ({
      deviceState: { ...state.deviceState, [id]: { ...state.deviceState[id], ...update } },
    })),
    setDeviceConnection: (id, update) => set(state => ({
      deviceConnection: { ...state.deviceConnection, [id]: { ...state.deviceConnection[id], ...update } },
    })),
    setDeviceData: (id, data) => set(state => ({
      deviceData: { ...state.deviceData, [id]: data },
    })),
    updateDeviceTypeInfo: (id, typeInfo) => set(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [id]: {
          ...state.deviceMetadata[id],
          typeInfo: { ...state.deviceMetadata[id].typeInfo, ...typeInfo },
        },
      },
    })),
    setDeviceGroup: (id, group) => set(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [id]: {
          ...state.deviceMetadata[id],
          group,
        },
      },
    })),
    setDeviceUserPrefs: (id, prefs) => set(state => ({
      deviceUserPrefs: {
        ...state.deviceUserPrefs,
        [id]: { ...state.deviceUserPrefs[id], ...prefs },
      },
    })),
  }))
);

// --- Timeline selectors/hooks ---
export const useTimelineResponses = () => useAppStore(state => state.timeline.responses);
export const useAddTimelineResponse = () => useAppStore(state => state.addTimelineResponse);
export const useUpdateTimelineResponse = () => useAppStore(state => state.updateTimelineResponse);
export const useDeleteTimelineResponse = () => useAppStore(state => state.deleteTimelineResponse);
export const useSetTimelineResponses = () => useAppStore(state => state.setTimelineResponses); 