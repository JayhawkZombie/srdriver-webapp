import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * Playback state and actions for global timeline/spectrogram coordination.
 */
export interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  totalDuration: number;
}

export interface PlaybackContextValue extends PlaybackState {
  setCurrentTime: (t: number) => void;
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  // Add more actions as needed
}

const DEFAULT_TOTAL_DURATION = 15;

const PlaybackContext = createContext<PlaybackContextValue | undefined>(undefined);

/**
 * Provider for global playback state. Wrap your app or timeline/spectrogram root with this.
 */
export const PlaybackProvider: React.FC<{ children: React.ReactNode, totalDuration?: number }> = ({ children, totalDuration = DEFAULT_TOTAL_DURATION }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const seek = useCallback((t: number) => setCurrentTime(t), []);

  const value: PlaybackContextValue = {
    currentTime,
    isPlaying,
    totalDuration,
    setCurrentTime,
    play,
    pause,
    seek,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
};

/**
 * Hook to access global playback state and actions.
 */
export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used within a PlaybackProvider");
  return ctx;
} 