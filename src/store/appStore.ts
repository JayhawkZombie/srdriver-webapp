import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { set as idbSet, get as idbGet } from 'idb-keyval';

// --- Generic IndexedDB middleware ---
export function persistWithIndexedDB<T extends object>(key: string, config: StateCreator<T>): StateCreator<T> {
  return (set, _get, api) => {
    console.log('[Zustand] Hydration starting...');
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
        if (s.deviceMetadata) {
          set((state: T) => ({ ...state, deviceMetadata: s.deviceMetadata } as T));
        }
        if (s.devices) {
          set((state: T) => ({ ...state, devices: s.devices } as T));
        }
      }
      set((state: T) => ({ ...state, hydrated: true } as T));
      console.log('[Zustand] Hydration complete. deviceMetadata:', _get().deviceMetadata);
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
        deviceMetadata: state.deviceMetadata,
        devices: state.devices,
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
  browserId: string;
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
  devices: string[]; // still an array of device IDs for ordering, but all maps below are keyed by browserId
  deviceMetadata: { [browserId: string]: DeviceMetadata }; // now keyed by browserId
  deviceState: { [browserId: string]: DeviceUIState };
  deviceConnection: { [browserId: string]: DeviceConnectionStatus };
  deviceData: { [browserId: string]: DeviceDataBlob };
  deviceUserPrefs: { [browserId: string]: DeviceUserPrefs[string] };
  hydrated: boolean;
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
  setDeviceNickname: (id: string, nickname: string) => void;
  setDeviceState: (id: string, state: Partial<DeviceUIState>) => void;
  setDeviceConnection: (id: string, status: Partial<DeviceConnectionStatus>) => void;
  setDeviceData: (id: string, data: DeviceDataBlob) => void;
  updateDeviceTypeInfo: (id: string, typeInfo: Partial<DeviceTypeInfo>) => void;
  setDeviceGroup: (id: string, group: string | null) => void;
  setDeviceUserPrefs: (id: string, prefs: Partial<DeviceUserPrefs[string]>) => void;
  hydrated: boolean;
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
    hydrated: false,
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
    addDevice: (metadata) => set(state => {
      const prev = state.deviceMetadata[metadata.browserId] || {};
      return {
        devices: state.devices.includes(metadata.browserId)
          ? state.devices
          : [...state.devices, metadata.browserId],
        deviceMetadata: {
          ...state.deviceMetadata,
          [metadata.browserId]: {
            ...prev,
            ...metadata,
            nickname: metadata.nickname || prev.nickname || '',
            group: metadata.group !== undefined ? metadata.group : prev.group ?? null,
            tags: metadata.tags || prev.tags || [],
            typeInfo: { ...prev.typeInfo, ...metadata.typeInfo },
          },
        },
      };
    }),
    removeDevice: (id) => set(state => {
      const restMeta = Object.fromEntries(Object.entries(state.deviceMetadata).filter(([key]) => key !== id));
      const restState = Object.fromEntries(Object.entries(state.deviceState).filter(([key]) => key !== id));
      const restConn = Object.fromEntries(Object.entries(state.deviceConnection).filter(([key]) => key !== id));
      const restData = Object.fromEntries(Object.entries(state.deviceData).filter(([key]) => key !== id));
      const restPrefs = Object.fromEntries(Object.entries(state.deviceUserPrefs).filter(([key]) => key !== id));
      return {
        devices: state.devices.filter(did => did !== id),
        deviceMetadata: restMeta,
        deviceState: restState,
        deviceConnection: restConn,
        deviceData: restData,
        deviceUserPrefs: restPrefs,
      };
    }),
    setDeviceMetadata: (browserId, metadata) => set(state => ({
      deviceMetadata: { ...state.deviceMetadata, [browserId]: metadata },
    })),
    setDeviceNickname: (browserId, nickname) => set(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [browserId]: {
          ...state.deviceMetadata[browserId],
          nickname,
        },
      },
    })),
    setDeviceState: (browserId, update) => set(state => ({
      deviceState: { ...state.deviceState, [browserId]: { ...state.deviceState[browserId], ...update } },
    })),
    setDeviceConnection: (browserId, update) => set(state => ({
      deviceConnection: { ...state.deviceConnection, [browserId]: { ...state.deviceConnection[browserId], ...update } },
    })),
    setDeviceData: (browserId, data) => set(state => ({
      deviceData: { ...state.deviceData, [browserId]: data },
    })),
    updateDeviceTypeInfo: (browserId, typeInfo) => set(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [browserId]: {
          ...state.deviceMetadata[browserId],
          typeInfo: { ...state.deviceMetadata[browserId].typeInfo, ...typeInfo },
        },
      },
    })),
    setDeviceGroup: (browserId, group) => set(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [browserId]: {
          ...state.deviceMetadata[browserId],
          group,
        },
      },
    })),
    setDeviceUserPrefs: (browserId, prefs) => set(state => ({
      deviceUserPrefs: { ...state.deviceUserPrefs, [browserId]: { ...state.deviceUserPrefs[browserId], ...prefs } },
    })),
  }))
); 

// --- Timeline selectors/hooks ---
export const useTimelineResponses = () => useAppStore(state => state.timeline.responses);
export const useAddTimelineResponse = () => useAppStore(state => state.addTimelineResponse);
export const useUpdateTimelineResponse = () => useAppStore(state => state.updateTimelineResponse);
export const useDeleteTimelineResponse = () => useAppStore(state => state.deleteTimelineResponse);
export const useSetTimelineResponses = () => useAppStore(state => state.setTimelineResponses);

export const useDeviceMetadata = (browserId: string) =>
  useAppStore(state => state.deviceMetadata[browserId]);
export const useDeviceState = (browserId: string) =>
  useAppStore(state => state.deviceState[browserId]);
export const useDeviceConnection = (browserId: string) =>
  useAppStore(state => state.deviceConnection[browserId]);
export const useDeviceUserPrefs = (browserId: string) =>
  useAppStore(state => state.deviceUserPrefs[browserId]);

export const useHydrated = () => useAppStore(state => state.hydrated); 