// selectors.ts - Centralized Zustand selectors for audio/timeline state
// Use these selectors for all waveform/audio data access in components.

import type { AppState } from './appStore';

// Audio selectors
export const selectWaveform = (state: AppState, type?: string) => {
  if (type && state.audio.analysis.waveforms) {
    return state.audio.analysis.waveforms[type] || [];
  }
  return state.audio.analysis.waveform;
};
export const selectDuration = (state: AppState) =>
  state.audio.analysis.duration ?? 0;
export const selectBarData = (state: AppState) => state.audio.analysis.barData;

// Playback selectors
export const selectCurrentTime = (state: AppState) => state.playback.currentTime;
export const selectIsPlaying = (state: AppState) => state.playback.isPlaying;
export const selectTotalDuration = (state: AppState) => state.playback.totalDuration;

// UI selectors
export const selectWindowSec = (state: AppState) => state.ui.windowSec; 

// Select a specific waveform type from the store
export const selectWaveformOfType = (type: string) => (state: AppState) => state.audio.analysis.waveforms?.[type] || []; 