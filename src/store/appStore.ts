import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { set as idbSet, get as idbGet } from 'idb-keyval';
import type { ResponseRectPalette } from '../types/ResponseRectPalette';
import { responseRectPalettes } from '../constants/responseRectPalettes';
import type { BandData } from '../components/visuals/bandPlotUtils';

// --- Storybook detection ---
const isStorybook = Boolean(((window as unknown) as Record<string, unknown>).__STORYBOOK_ADDONS_CHANNEL__);

// --- Utility: Safe deep merge for nested Zustand updates ---
function safeMerge<T>(base: T, update: Partial<T>): T {
  if (typeof base !== 'object' || base === null) return update as T;
  const result = { ...base } as Record<string, unknown>;
  for (const key in update) {
    if (
      Object.prototype.hasOwnProperty.call(update, key) &&
      typeof update[key] === 'object' &&
      update[key] !== null &&
      typeof (base as Record<string, unknown>)[key] === 'object' &&
      (base as Record<string, unknown>)[key] !== null
    ) {
      // Type-safe recursive call for nested objects
      type Value = typeof base extends Record<string, unknown> ? typeof base[typeof key] : unknown;
      result[key] = safeMerge(
        (base as Record<string, unknown>)[key] as Value,
        update[key] as Partial<Value>
      );
    } else {
      result[key] = update[key];
    }
  }
  return result as T;
}

// --- Utility: Ensure all top-level fields are present and correct type ---
const initialTopLevel = {
  timeline: { responses: [] },
  logs: [],
  palettes: {},
  rectTemplates: {},
  templateTypes: [],
  tracks: { mapping: {} },
  devices: [],
  deviceMetadata: {},
  deviceState: {},
  deviceConnection: {},
  deviceData: {},
  deviceUserPrefs: {},
  audio: { data: { metadata: null, analysis: null }, analysis: { summary: null } },
  playback: { currentTime: 0, isPlaying: false, totalDuration: 0 },
  ui: { windowSec: 4, showFirstDerivative: false, showSecondDerivative: false, showImpulses: true, showSustainedImpulses: false, onlySustained: false, showDetectionFunction: false },
  hydrated: false,
  waveformProgress: null,
  fftProgress: null,
  aubioProgress: null,
  maxLogCount: 200,
};

function ensureTopLevelFields<T extends object>(state: T): T {
  const merged = { ...initialTopLevel, ...state };
  // Ensure timeline.responses is always an array
  if (!merged.timeline || !Array.isArray(merged.timeline.responses)) {
    merged.timeline = { responses: [] };
  }
  // Ensure logs is always an array
  if (!Array.isArray(merged.logs)) {
    merged.logs = [];
  }
  // Add more field checks as needed
  return merged as T;
}

// --- General guard for large arrays in Zustand set ---
function guardedSet<T extends object>(set: (fn: (state: T) => T | Partial<T>) => void) {
  return (fn: (state: T) => T | Partial<T>) => {
    const nextState = fn({} as T); // We don't have the actual state here, but this is sufficient for the check
    function checkLargeArrays(obj: unknown, path: string[] = []): boolean {
      if (Array.isArray(obj) && obj.length > 10000) {
        const stack = new Error().stack?.split('\n').slice(2, 7).join('\n') ?? '';
        return !window.confirm(
          `You are about to store a very large array (${obj.length}) at ${path.join('.')} in the app store. This may freeze your browser.\n\nStack trace:\n${stack}`
        );
      }
      if (obj && typeof obj === 'object') {
        for (const key in obj as Record<string, unknown>) {
          if (checkLargeArrays((obj as Record<string, unknown>)[key], [...path, key])) return true;
        }
      }
      return false;
    }
    if (checkLargeArrays(nextState)) {
      return;
    }
    // --- NEW: Ensure all top-level fields are present and correct type ---
    set((prev: T) => ensureTopLevelFields(safeMerge(prev, nextState)));
  };
}

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
      const current = _get();
      if (
        typeof current === 'object' &&
        current !== null &&
        'deviceMetadata' in current &&
        typeof (current as { deviceMetadata?: unknown }).deviceMetadata === 'object'
      ) {
        console.log('[Zustand] Hydration complete. deviceMetadata:', (current as { deviceMetadata: unknown }).deviceMetadata);
      } else {
        console.log('[Zustand] Hydration complete.');
      }
    });
    const setAndPersist: typeof set = (fnOrObj: unknown) => {
      set(fnOrObj as T);
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
  data: Record<string, unknown>;
  triggered: boolean;
  intent?: string; // e.g., 'primary', 'error', 'success', etc.
}

// --- Grouped Zustand store ---
export interface AudioDataMetadata {
  fileName: string;
  lastModified: number;
}

export interface AudioDataAnalysis {
  // Only summary/downsampled/visualization fields should be here
  normalizedFftSequence?: number[][]; // Downsampled for visualization
  summary: Record<string, unknown> | null;
  bandDataArr?: BandData[];
  detectionFunction?: number[];
  detectionTimes?: number[];
  waveform?: number[];
  duration?: number;
  aubioEvents?: DetectionEvent[];
  aubioError?: string;
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
  [key: string]: unknown;
};

export type DeviceUserPrefs = {
  [id: string]: {
    autoReconnect?: boolean;
    preferredGroup?: string;
    // Extend as needed
  };
};

// --- AppState ---
export interface TrackTarget {
  type: 'device' | 'group' | 'other';
  id: string;
}

export interface TracksState {
  mapping: { [trackIndex: number]: TrackTarget | undefined };
  // Add more per-track config here as needed
}

export interface TemplateType {
  value: string;
  label: string;
}

export interface TemplateDataField {
  key: string;
  value: unknown;
  lockKey?: boolean;
  lockValue?: boolean;
}

export interface RectTemplate {
  id: string;
  name: string;
  type: string;
  defaultDuration: number;
  defaultData: Record<string, unknown>;
  paletteName: string;
}

export type DetectionEvent = { time: number; strength?: number };

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
  tracks: TracksState;
  devices: string[];
  deviceMetadata: { [browserId: string]: DeviceMetadata };
  deviceState: { [browserId: string]: DeviceUIState };
  deviceConnection: { [browserId: string]: DeviceConnectionStatus };
  deviceData: { [browserId: string]: DeviceDataBlob };
  deviceUserPrefs: { [browserId: string]: DeviceUserPrefs[string] };
  hydrated: boolean;
  palettes: Record<string, ResponseRectPalette>;
  rectTemplates: Record<string, RectTemplate>;
  templateTypes: TemplateType[];
  waveformProgress: { processed: number; total: number; jobId?: string } | null;
  logs: LogEntry[];
  maxLogCount: number;
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
  setTrackTarget: (trackIndex: number, target: TrackTarget | undefined) => void;
  setPalette: (name: string, palette: ResponseRectPalette) => void;
  removePalette: (name: string) => void;
  getPalette: (name?: string) => ResponseRectPalette;
  addLog: (level: string, category: string, message: string, data?: unknown) => void;
  clearLogs: () => void;
  getLogsByCategory: (category: string) => LogEntry[];
  getLogsByLevel: (level: string) => LogEntry[];
  addRectTemplate: (template: RectTemplate) => void;
  updateRectTemplate: (id: string, update: Partial<RectTemplate>) => void;
  deleteRectTemplate: (id: string) => void;
  getRectTemplate: (id: string) => RectTemplate | undefined;
  getRectTemplates: () => RectTemplate[];
  addTemplateType: (type: TemplateType) => void;
  removeTemplateType: (value: string) => void;
  updateTemplateType: (value: string, update: Partial<TemplateType>) => void;
  setWaveformProgress: (progress: { processed: number; total: number; jobId?: string } | null) => void;
  fftProgress: { processed: number; total: number; jobId?: string } | null;
  aubioProgress: { processed: number; total: number; jobId?: string } | null;
  setFftProgress: (progress: { processed: number; total: number; jobId?: string } | null) => void;
  setAubioProgress: (progress: { processed: number; total: number; jobId?: string } | null) => void;
  setFftResult: (result: { normalizedFftSequence?: number[][]; summary?: Record<string, unknown> }) => void;
  setAubioResult: (result: { detectionFunction: number[]; times: number[]; events: DetectionEvent[]; error?: string }) => void;
  setBandDataArr: (bandDataArr: BandData[]) => void;
}

// --- Initial state ---
const initialAudioData: AudioDataState = {
  metadata: null,
  analysis: null,
};
const initialAudioAnalysis: AudioDataAnalysis = {
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
const initialDeviceMetadata: { [id: string]: DeviceMetadata } = {
  'mock-device-1': {
    browserId: 'mock-device-1',
    name: 'Demo Device 1',
    nickname: 'Demo Device 1',
    group: '',
    tags: [],
    typeInfo: {
      model: 'MockModel',
      firmwareVersion: '1.0.0',
      numLEDs: 60,
      ledLayout: 'strip',
      capabilities: ['led', 'pattern'],
    },
  },
};
const initialDeviceState: { [id: string]: DeviceUIState } = {};
const initialDeviceConnection: { [id: string]: DeviceConnectionStatus } = {};
const initialDeviceData: { [id: string]: DeviceDataBlob } = {};
const initialDeviceUserPrefs: DeviceUserPrefs = {};
const initialTracks: TracksState = {
  mapping: {
    0: { type: 'device', id: 'mock-device-1' },
    1: undefined,
    2: undefined,
  },
};

export type LogEntry = {
  id: string;
  timestamp: number;
  level: string;
  category: string;
  message: string;
  data?: unknown;
};

export const useAppStore = create<AppState & {
  setAudioData: (data: { waveform: number[]; duration: number }) => void;
  setWaveformProgress: (progress: { processed: number; total: number; jobId?: string } | null) => void;
  waveformProgress: { processed: number; total: number; jobId?: string } | null;
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
  setTrackTarget: (trackIndex: number, target: TrackTarget | undefined) => void;
  hydrated: boolean;
  setPalette: (name: string, palette: ResponseRectPalette) => void;
  removePalette: (name: string) => void;
  getPalette: (name?: string) => ResponseRectPalette;
  logs: LogEntry[];
  addLog: (level: string, category: string, message: string, data?: unknown) => void;
  clearLogs: () => void;
  getLogsByCategory: (category: string) => LogEntry[];
  getLogsByLevel: (level: string) => LogEntry[];
  maxLogCount: number;
  rectTemplates: Record<string, RectTemplate>;
  addRectTemplate: (template: RectTemplate) => void;
  updateRectTemplate: (id: string, update: Partial<RectTemplate>) => void;
  deleteRectTemplate: (id: string) => void;
  getRectTemplate: (id: string) => RectTemplate | undefined;
  getRectTemplates: () => RectTemplate[];
  addTemplateType: (type: TemplateType) => void;
  removeTemplateType: (value: string) => void;
  updateTemplateType: (value: string, update: Partial<TemplateType>) => void;
}>(
  isStorybook
    ? ((set, get) => {
        const guarded = guardedSet(set);
        // Use guarded instead of set for all state updates
        return {
          audio: {
            data: initialAudioData,
            analysis: initialAudioAnalysis,
          },
          playback: initialPlayback,
          ui: initialUI,
          timeline: initialTimeline,
          tracks: initialTracks,
          devices: [],
          deviceMetadata: initialDeviceMetadata,
          deviceState: initialDeviceState,
          deviceConnection: initialDeviceConnection,
          deviceData: initialDeviceData,
          deviceUserPrefs: initialDeviceUserPrefs,
          hydrated: true,
          palettes: { ...responseRectPalettes },
          rectTemplates: {
            'led-beat': {
              id: 'led-beat',
              name: 'LED Beat',
              type: 'led',
              defaultDuration: 1,
              defaultData: { pattern: 'beat', color: '#00ff00' },
              paletteName: 'lightPulse',
            },
            'led-wave': {
              id: 'led-wave',
              name: 'LED Wave',
              type: 'led',
              defaultDuration: 2,
              defaultData: { pattern: 'wave', color: '#0000ff' },
              paletteName: 'singleFirePattern',
            },
          },
          templateTypes: [
            { value: 'pulse', label: 'Pulse' },
            { value: 'pattern', label: 'Pattern' },
            { value: 'cue', label: 'Cue' },
            { value: 'settings', label: 'Settings Change' },
            { value: 'led', label: 'LED' },
          ],
          waveformProgress: null,
          logs: [],
          maxLogCount: 200,
          setAudioData: ({ waveform, duration }) => guarded(state => ({
            audio: safeMerge(state.audio ?? {}, {
              analysis: ensureAudioDataAnalysis({
                ...state.audio?.analysis,
                waveform,
                duration,
              })
            }),
            playback: {
              ...state.playback,
              totalDuration: duration,
            },
          })),
          setWaveformProgress: (progress) => guarded(() => ({ waveformProgress: progress })),
          addTimelineResponse: (resp) => set(state => ({
            ...state,
            timeline: {
              ...state.timeline,
              responses: [...(state.timeline?.responses ?? []), resp],
            },
          })),
          updateTimelineResponse: (id, update) => set(state => ({
            ...state,
            timeline: {
              ...state.timeline,
              responses: (state.timeline?.responses ?? []).map(r => r.id === id ? { ...r, ...update } : r),
            },
          })),
          deleteTimelineResponse: (id) => set(state => ({
            ...state,
            timeline: {
              ...state.timeline,
              responses: (state.timeline?.responses ?? []).filter(r => r.id !== id),
            },
          })),
          setTimelineResponses: (responses) => set(state => ({
            ...state,
            timeline: {
              ...state.timeline,
              responses,
            },
          })),
          addDevice: (metadata) => guarded(state => {
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
          removeDevice: (id) => guarded(state => {
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
          setDeviceMetadata: (browserId, metadata) => guarded(state => ({
            deviceMetadata: { ...state.deviceMetadata, [browserId]: metadata },
          })),
          setDeviceNickname: (browserId, nickname) => guarded(state => ({
            deviceMetadata: {
              ...state.deviceMetadata,
              [browserId]: {
                ...state.deviceMetadata[browserId],
                nickname,
              },
            },
          })),
          setDeviceState: (browserId, update) => guarded(state => ({
            deviceState: { ...state.deviceState, [browserId]: { ...state.deviceState[browserId], ...update } },
          })),
          setDeviceConnection: (browserId, update) => guarded(state => ({
            deviceConnection: { ...state.deviceConnection, [browserId]: { ...state.deviceConnection[browserId], ...update } },
          })),
          setDeviceData: (browserId, data) => guarded(state => ({
            deviceData: { ...state.deviceData, [browserId]: data },
          })),
          updateDeviceTypeInfo: (browserId, typeInfo) => guarded(state => ({
            deviceMetadata: {
              ...state.deviceMetadata,
              [browserId]: {
                ...state.deviceMetadata[browserId],
                typeInfo: { ...state.deviceMetadata[browserId].typeInfo, ...typeInfo },
              },
            },
          })),
          setDeviceGroup: (browserId, group) => guarded(state => ({
            deviceMetadata: {
              ...state.deviceMetadata,
              [browserId]: {
                ...state.deviceMetadata[browserId],
                group,
              },
            },
          })),
          setDeviceUserPrefs: (browserId, prefs) => guarded(state => ({
            deviceUserPrefs: { ...state.deviceUserPrefs, [browserId]: { ...state.deviceUserPrefs[browserId], ...prefs } },
          })),
          setTrackTarget: (trackIndex, target) => guarded(state => ({
            tracks: {
              ...state.tracks,
              mapping: { ...state.tracks.mapping, [trackIndex]: target },
            },
          })),
          setPalette: (name, palette) => guarded(state => ({
            palettes: { ...state.palettes, [name]: palette },
          })),
          removePalette: (name) => guarded(state => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [name]: __, ...rest } = state.palettes;
            return { palettes: rest };
          }),
          getPalette: (name) => {
            const palettes = get().palettes;
            if (!name) return palettes['led'] || Object.values(palettes)[0];
            return palettes[name] || palettes['led'] || Object.values(palettes)[0];
          },
          addLog: (level, category, message, data) => guarded(state => {
            const max = state.maxLogCount || 200;
            const newLog = { id: crypto.randomUUID(), timestamp: Date.now(), level, category, message, data };
            const logs = [...state.logs, newLog];
            // Cap logs at maxLogCount
            const cappedLogs = logs.length > max ? logs.slice(logs.length - max) : logs;
            return { logs: cappedLogs };
          }),
          clearLogs: () => guarded(() => ({ logs: [] })),
          getLogsByCategory: (category) => get().logs.filter(log => log.category === category),
          getLogsByLevel: (level) => get().logs.filter(log => log.level === level),
          addRectTemplate: (template) => guarded(state => ({
            rectTemplates: {
              ...state.rectTemplates,
              [template.id]: {
                ...template,
                defaultData: migrateDefaultData(template.defaultData),
              },
            },
          })),
          updateRectTemplate: (id, update) => guarded(state => ({
            rectTemplates: {
              ...state.rectTemplates,
              [id]: {
                ...state.rectTemplates[id],
                ...update,
                defaultData: update.defaultData
                  ? migrateDefaultData(update.defaultData)
                  : state.rectTemplates[id].defaultData,
              },
            },
          })),
          deleteRectTemplate: (id) => guarded(state => {
            const rest = Object.fromEntries(Object.entries(state.rectTemplates).filter(([key]) => key !== id));
            return { rectTemplates: rest };
          }),
          getRectTemplate: (id) => get().rectTemplates[id],
          getRectTemplates: () => Object.values(get().rectTemplates),
          addTemplateType: (type) => guarded(state => ({
            templateTypes: [...state.templateTypes, type],
          })),
          removeTemplateType: (value) => guarded(state => ({
            templateTypes: state.templateTypes.filter(t => t.value !== value),
          })),
          updateTemplateType: (value, update) => guarded(state => ({
            templateTypes: state.templateTypes.map(t => t.value === value ? { ...t, ...update } : t),
          })),
          fftProgress: null,
          aubioProgress: null,
          setFftProgress: (progress) => guarded(() => ({ fftProgress: progress })),
          setAubioProgress: (progress) => guarded(() => ({ aubioProgress: progress })),
          setFftResult: (result) => {
            // Only store downsampled/summary data in Zustand
            guarded(state => ({
              audio: safeMerge(state.audio ?? {}, {
                analysis: ensureAudioDataAnalysis({
                  ...state.audio?.analysis,
                  normalizedFftSequence: result.normalizedFftSequence,
                  summary: result.summary ?? state.audio?.analysis?.summary,
                })
              })
            }));
          },
          setAubioResult: (result) => guarded(state => ({
            audio: safeMerge(state.audio ?? {}, {
              analysis: ensureAudioDataAnalysis({
                ...state.audio?.analysis,
                detectionFunction: result.detectionFunction,
                detectionTimes: result.times,
                aubioEvents: result.events,
                aubioError: result.error,
              })
            })
          })),
          setBandDataArr: (bandDataArr) => {
            if (Array.isArray(bandDataArr) && bandDataArr.length > 10000) {
              if (!window.confirm(`You are about to store a very large bandDataArr (${bandDataArr.length} bands) in the app store. This may freeze your browser. Continue?`)) {
                return;
              }
            }
            guarded(state => ({
              audio: safeMerge(state.audio ?? {}, {
                analysis: ensureAudioDataAnalysis({
                  ...state.audio?.analysis,
                  bandDataArr
                })
              })
            }));
          },
        };
      })
    : persistWithIndexedDB('app-state', (set, get) => {
        const guarded = guardedSet(set);
        // Use guarded instead of set for all state updates
        return {
    audio: {
      data: initialAudioData,
      analysis: initialAudioAnalysis,
    },
    playback: initialPlayback,
    ui: initialUI,
    timeline: initialTimeline,
          tracks: initialTracks,
    devices: [],
    deviceMetadata: initialDeviceMetadata,
    deviceState: initialDeviceState,
    deviceConnection: initialDeviceConnection,
    deviceData: initialDeviceData,
    deviceUserPrefs: initialDeviceUserPrefs,
    hydrated: false,
          palettes: { ...responseRectPalettes },
          rectTemplates: {
            'led-beat': {
              id: 'led-beat',
              name: 'LED Beat',
              type: 'led',
              defaultDuration: 1,
              defaultData: { pattern: 'beat', color: '#00ff00' },
              paletteName: 'lightPulse',
            },
            'led-wave': {
              id: 'led-wave',
              name: 'LED Wave',
              type: 'led',
              defaultDuration: 2,
              defaultData: { pattern: 'wave', color: '#0000ff' },
              paletteName: 'singleFirePattern',
            },
          },
          templateTypes: [
            { value: 'pulse', label: 'Pulse' },
            { value: 'pattern', label: 'Pattern' },
            { value: 'cue', label: 'Cue' },
            { value: 'settings', label: 'Settings Change' },
            { value: 'led', label: 'LED' },
          ],
          waveformProgress: null,
          logs: [],
          maxLogCount: 200,
          setAudioData: ({ waveform, duration }) => guarded(state => ({
        audio: safeMerge(state.audio ?? {}, {
          analysis: ensureAudioDataAnalysis({
            ...state.audio?.analysis,
            waveform,
            duration,
          })
        }),
        playback: {
          ...state.playback,
          totalDuration: duration,
        },
          })),
    addTimelineResponse: (resp) => set(state => ({
      ...state,
      timeline: {
        ...state.timeline,
        responses: [...(state.timeline?.responses ?? []), resp],
      },
    })),
    updateTimelineResponse: (id, update) => set(state => ({
      ...state,
      timeline: {
        ...state.timeline,
        responses: (state.timeline?.responses ?? []).map(r => r.id === id ? { ...r, ...update } : r),
      },
    })),
    deleteTimelineResponse: (id) => set(state => ({
      ...state,
      timeline: {
        ...state.timeline,
        responses: (state.timeline?.responses ?? []).filter(r => r.id !== id),
      },
    })),
    setTimelineResponses: (responses) => set(state => ({
      ...state,
      timeline: {
        ...state.timeline,
        responses,
      },
    })),
          addDevice: (metadata) => guarded(state => {
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
          removeDevice: (id) => guarded(state => {
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
          setDeviceMetadata: (browserId, metadata) => guarded(state => ({
      deviceMetadata: { ...state.deviceMetadata, [browserId]: metadata },
    })),
          setDeviceNickname: (browserId, nickname) => guarded(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [browserId]: {
          ...state.deviceMetadata[browserId],
          nickname,
        },
      },
    })),
          setDeviceState: (browserId, update) => guarded(state => ({
      deviceState: { ...state.deviceState, [browserId]: { ...state.deviceState[browserId], ...update } },
    })),
          setDeviceConnection: (browserId, update) => guarded(state => ({
      deviceConnection: { ...state.deviceConnection, [browserId]: { ...state.deviceConnection[browserId], ...update } },
    })),
          setDeviceData: (browserId, data) => guarded(state => ({
      deviceData: { ...state.deviceData, [browserId]: data },
    })),
          updateDeviceTypeInfo: (browserId, typeInfo) => guarded(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [browserId]: {
          ...state.deviceMetadata[browserId],
          typeInfo: { ...state.deviceMetadata[browserId].typeInfo, ...typeInfo },
        },
      },
    })),
          setDeviceGroup: (browserId, group) => guarded(state => ({
      deviceMetadata: {
        ...state.deviceMetadata,
        [browserId]: {
          ...state.deviceMetadata[browserId],
          group,
        },
      },
    })),
          setDeviceUserPrefs: (browserId, prefs) => guarded(state => ({
      deviceUserPrefs: { ...state.deviceUserPrefs, [browserId]: { ...state.deviceUserPrefs[browserId], ...prefs } },
    })),
          setTrackTarget: (trackIndex, target) => guarded(state => ({
            tracks: {
              ...state.tracks,
              mapping: { ...state.tracks.mapping, [trackIndex]: target },
            },
          })),
          setPalette: (name, palette) => guarded(state => ({
            palettes: { ...state.palettes, [name]: palette },
          })),
          removePalette: (name) => guarded(state => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [name]: __, ...rest } = state.palettes;
            return { palettes: rest };
          }),
          getPalette: (name) => {
            const palettes = get().palettes;
            if (!name) return palettes['led'] || Object.values(palettes)[0];
            return palettes[name] || palettes['led'] || Object.values(palettes)[0];
          },
          addLog: (level, category, message, data) => guarded(state => {
            const max = state.maxLogCount || 200;
            const newLog = { id: crypto.randomUUID(), timestamp: Date.now(), level, category, message, data };
            const logs = [...state.logs, newLog];
            // Cap logs at maxLogCount
            const cappedLogs = logs.length > max ? logs.slice(logs.length - max) : logs;
            return { logs: cappedLogs };
          }),
          clearLogs: () => guarded(() => ({ logs: [] })),
          getLogsByCategory: (category) => get().logs.filter(log => log.category === category),
          getLogsByLevel: (level) => get().logs.filter(log => log.level === level),
          addRectTemplate: (template) => guarded(state => ({
            rectTemplates: {
              ...state.rectTemplates,
              [template.id]: {
                ...template,
                defaultData: migrateDefaultData(template.defaultData),
              },
            },
          })),
          updateRectTemplate: (id, update) => guarded(state => ({
            rectTemplates: {
              ...state.rectTemplates,
              [id]: {
                ...state.rectTemplates[id],
                ...update,
                defaultData: update.defaultData
                  ? migrateDefaultData(update.defaultData)
                  : state.rectTemplates[id].defaultData,
              },
            },
          })),
          deleteRectTemplate: (id) => guarded(state => {
            const rest = Object.fromEntries(Object.entries(state.rectTemplates).filter(([key]) => key !== id));
            return { rectTemplates: rest };
          }),
          getRectTemplate: (id) => get().rectTemplates[id],
          getRectTemplates: () => Object.values(get().rectTemplates),
          addTemplateType: (type) => guarded(state => ({
            templateTypes: [...state.templateTypes, type],
          })),
          removeTemplateType: (value) => guarded(state => ({
            templateTypes: state.templateTypes.filter(t => t.value !== value),
          })),
          updateTemplateType: (value, update) => guarded(state => ({
            templateTypes: state.templateTypes.map(t => t.value === value ? { ...t, ...update } : t),
          })),
          setWaveformProgress: (progress) => guarded(() => ({ waveformProgress: progress })),
          fftProgress: null,
          aubioProgress: null,
          setFftProgress: (progress) => guarded(() => ({ fftProgress: progress })),
          setAubioProgress: (progress) => guarded(() => ({ aubioProgress: progress })),
          setFftResult: (result) => {
            // Only store downsampled/summary data in Zustand
            guarded(state => ({
              audio: safeMerge(state.audio ?? {}, {
                analysis: ensureAudioDataAnalysis({
                  ...state.audio?.analysis,
                  normalizedFftSequence: result.normalizedFftSequence,
                  summary: result.summary ?? state.audio?.analysis?.summary,
                })
              })
            }));
          },
          setAubioResult: (result) => guarded(state => {
            console.log('setAubioResult', result);
            return {
            audio: safeMerge(state.audio ?? {}, {
              analysis: ensureAudioDataAnalysis({
                ...state.audio?.analysis,
                detectionFunction: result.detectionFunction,
                detectionTimes: result.times,
                aubioEvents: result.events,
                aubioError: result.error,
              })
            })
          }}),
          setBandDataArr: (bandDataArr) => {
            if (Array.isArray(bandDataArr) && bandDataArr.length > 10000) {
              if (!window.confirm(`You are about to store a very large bandDataArr (${bandDataArr.length} bands) in the app store. This may freeze your browser. Continue?`)) {
                return;
              }
            }
            guarded(state => ({
              audio: safeMerge(state.audio ?? {}, {
                analysis: ensureAudioDataAnalysis({
                  ...state.audio?.analysis,
                  bandDataArr
                })
              })
            }));
          },
        };
      })
); // --- Timeline selectors/hooks ---
export const useTimelineResponses = () => useAppStore(state => state.timeline.responses);
export const useAddTimelineResponse = () => useAppStore(state => state.addTimelineResponse);
export const useUpdateTimelineResponse = () => useAppStore(state => state.updateTimelineResponse);
export const useDeleteTimelineResponse = () => useAppStore(state => state.deleteTimelineResponse);
export const useSetTimelineResponses = () => useAppStore(state => state.setTimelineResponses);

export const useTrackTargets = () => useAppStore(state => state.tracks.mapping);
export const useSetTrackTarget = () => useAppStore(state => state.setTrackTarget);

// Selector to get the target for a specific track index
export const useTrackTarget = (trackIndex: number) => useAppStore(state => state.tracks.mapping[trackIndex]);

// Helper to clear a track's target
export const useClearTrackTarget = () => {
  const setTrackTarget = useSetTrackTarget();
  return (trackIndex: number) => setTrackTarget(trackIndex, undefined);
};

// Helper to set multiple track targets at once
export const useSetTrackTargets = () => {
  return (mapping: { [trackIndex: number]: import('./appStore').TrackTarget }) =>
    useAppStore.setState(state => ({
      tracks: {
        ...state.tracks,
        mapping: { ...state.tracks.mapping, ...mapping },
      },
    }));
};

// Selector to get all track indices with assigned targets
export const useAssignedTrackIndices = () =>
  useAppStore(state => Object.keys(state.tracks.mapping).map(Number));

export const useDeviceMetadata = (browserId: string) =>
  useAppStore(state => state.deviceMetadata[browserId]);
export const useDeviceState = (browserId: string) =>
  useAppStore(state => state.deviceState[browserId]);
export const useDeviceConnection = (browserId: string) =>
  useAppStore(state => state.deviceConnection[browserId]);
export const useDeviceUserPrefs = (browserId: string) =>
  useAppStore(state => state.deviceUserPrefs[browserId]);

export const useHydrated = () => useAppStore(state => state.hydrated); 

export const useAddTemplateType = () => useAppStore(state => state.addTemplateType);
export const useRemoveTemplateType = () => useAppStore(state => state.removeTemplateType);

// Selector for all template types
export const selectTemplateTypes = (state: AppState) => state.templateTypes;

// Hook for updateTemplateType
export const useUpdateTemplateType = () => useAppStore(state => state.updateTemplateType);

// Migration utility for old templates
function migrateDefaultData(data: unknown): Record<string, unknown> {
  if (Array.isArray(data)) {
    // Convert array of {key, value} to object
    const obj: Record<string, unknown> = {};
    data.forEach(item => {
      if (item && typeof item === 'object' && 'key' in item && 'value' in item) {
        const { key, value } = item as { key: string; value: unknown };
        obj[key] = value;
      }
    });
    return obj;
  }
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>;
  }
  return {};
}

// Selector for all rect templates
export const selectRectTemplates = (state: AppState) => Object.values(state.rectTemplates);

// Helper to ensure AudioDataAnalysis always has required fields
function ensureAudioDataAnalysis(partial: Partial<AudioDataAnalysis>): AudioDataAnalysis {
  return {
    ...initialAudioAnalysis,
    ...partial,
  };
} 

