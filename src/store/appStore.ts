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
  // Add other groups as needed
}

// Initial state
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

export const useAppStore = create<AppState & {
  setAudioData: (data: { waveform: number[]; duration: number }) => void;
  addTimelineResponse: (resp: TimelineResponse) => void;
  updateTimelineResponse: (id: string, update: Partial<TimelineResponse>) => void;
  deleteTimelineResponse: (id: string) => void;
  setTimelineResponses: (responses: TimelineResponse[]) => void;
}>(
  persistWithIndexedDB('app-state', (set, get) => ({
    audio: {
      data: initialAudioData,
      analysis: initialAudioAnalysis,
    },
    playback: initialPlayback,
    ui: initialUI,
    timeline: initialTimeline,
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
  }))
);

// --- Timeline selectors/hooks ---
export const useTimelineResponses = () => useAppStore(state => state.timeline.responses);
export const useAddTimelineResponse = () => useAppStore(state => state.addTimelineResponse);
export const useUpdateTimelineResponse = () => useAppStore(state => state.updateTimelineResponse);
export const useDeleteTimelineResponse = () => useAppStore(state => state.deleteTimelineResponse);
export const useSetTimelineResponses = () => useAppStore(state => state.setTimelineResponses); 