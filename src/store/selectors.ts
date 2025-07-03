// selectors.ts - Centralized Zustand selectors for audio/timeline state
// Use these selectors for all waveform/audio data access in components.

import type { AppState } from './appStore';

// Audio selectors
export const selectWaveform = (state: AppState) => state.audio.analysis.waveform;
export const selectAudioBuffer = (state: AppState) => state.audio.data.analysis?.audioBuffer;
export const selectDuration = (state: AppState) =>
  state.audio.data.analysis?.audioBuffer?.duration ?? state.audio.analysis.duration;

// Playback selectors
export const selectCurrentTime = (state: AppState) => state.playback.currentTime;
export const selectIsPlaying = (state: AppState) => state.playback.isPlaying;
export const selectTotalDuration = (state: AppState) => state.playback.totalDuration;

// UI selectors
export const selectWindowSec = (state: AppState) => state.ui.windowSec; 