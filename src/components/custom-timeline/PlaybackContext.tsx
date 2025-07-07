import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

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
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
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
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);
  const isSeekingRef = useRef(false);
  const playbackStartTimeRef = useRef<number | null>(null);
  const startOffsetRef = useRef<number>(0);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  const setAudioBuffer = useCallback((buffer: AudioBuffer | null) => {
    audioBufferRef.current = buffer;
  }, []);

  const stopSource = () => {
    isSeekingRef.current = true;
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (timerRef.current) {
      if (audioBufferRef.current) {
        window.clearInterval(timerRef.current);
      } else {
        cancelAnimationFrame(timerRef.current);
      }
      timerRef.current = null;
    }
    setTimeout(() => { isSeekingRef.current = false; }, 0); // Reset after microtask
  };

  const play = useCallback(() => {
    if (audioBufferRef.current) {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      stopSource();
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioCtxRef.current.destination);
      source.start(0, currentTimeRef.current);
      source.onended = () => {
        if (!isSeekingRef.current) setIsPlaying(false);
      };
      sourceRef.current = source;
      setIsPlaying(true);
      playbackStartTimeRef.current = audioCtxRef.current.currentTime;
      startOffsetRef.current = currentTimeRef.current;
      // Timer to update currentTime using requestAnimationFrame
      const update = () => {
        if (!isPlayingRef.current) return;
        const now = audioCtxRef.current!.currentTime;
        setCurrentTime(startOffsetRef.current + (now - playbackStartTimeRef.current!));
        timerRef.current = requestAnimationFrame(update);
      };
      timerRef.current = requestAnimationFrame(update);
    } else {
      // DEMO MODE: advance playhead with requestAnimationFrame for smoothness
      stopSource();
      setIsPlaying(true);
      let lastTime = performance.now();
      const step = (now: number) => {
        if (!isPlayingRef.current) return;
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        setCurrentTime((t) => {
          const next = t + dt;
          if (next >= totalDuration) {
            setIsPlaying(false);
            stopSource();
            return totalDuration;
          }
          return next;
        });
        if (isPlayingRef.current) {
          timerRef.current = requestAnimationFrame(step);
        }
      };
      timerRef.current = requestAnimationFrame(step);
    }
  }, [totalDuration]);

  const pause = useCallback(() => {
    stopSource();
    setIsPlaying(false);
    if (audioCtxRef.current && playbackStartTimeRef.current !== null) {
      setCurrentTime(startOffsetRef.current + (audioCtxRef.current.currentTime - playbackStartTimeRef.current));
    }
  }, []);

  const seek = useCallback((t: number) => {
    stopSource();
    setCurrentTime(t);
    startOffsetRef.current = t;
    if (isPlayingRef.current) {
      setTimeout(() => play(), 0);
    }
  }, [play]);

  useEffect(() => () => { stopSource(); }, []);

  const value: PlaybackContextValue = {
    currentTime,
    isPlaying,
    totalDuration: audioBufferRef.current?.duration || totalDuration,
    setCurrentTime,
    play,
    pause,
    seek,
    setAudioBuffer,
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