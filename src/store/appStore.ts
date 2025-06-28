import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { set as idbSet, get as idbGet } from 'idb-keyval';

// --- Generic IndexedDB middleware ---
export function persistWithIndexedDB<T extends object>(key: string, config: StateCreator<T>): StateCreator<T> {
  return (set, get, api) => {
    // Only hydrate if store is at initial state
    idbGet(key).then((stored: any) => {
      const state = get();
      // Only hydrate if audioData is still initial (not already set in memory)
      const audioData = (state as any).audioData;
      if (
        stored &&
        (!audioData ||
          !audioData.analysis ||
          !audioData.analysis.fftSequence ||
          audioData.analysis.fftSequence.length === 0)
      ) {
        set(stored);
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
        }
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
}

export interface AudioDataState {
  metadata: AudioDataMetadata | null;
  analysis: AudioDataAnalysis | null;
}

export interface AppState {
  audioData: AudioDataState;
  setAudioData: (data: Partial<AudioDataState>) => void;
  // Add more slices here as needed
}

const initialAudioData: AudioDataState = {
  metadata: null,
  analysis: null,
};

export const useAppStore = create<AppState>(
  persistWithIndexedDB<AppState>('app-state', (set, get) => ({
    audioData: initialAudioData,
    setAudioData: (data) => set(state => ({ audioData: { ...state.audioData, ...data } })),
    // Add more actions/slices here
  }))
); 