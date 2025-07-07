import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  mediaType: "audio" | "video" | "unknown";
}

export interface PlaybackController {
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  setBuffer: (buffer: AudioBuffer | null) => void;
}

interface PlaybackContextValue extends PlaybackState, PlaybackController {}

const DEFAULT_TOTAL_DURATION = 15;

const PlaybackContext = createContext<PlaybackContextValue | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: React.ReactNode, totalDuration?: number }> = ({ children, totalDuration = DEFAULT_TOTAL_DURATION }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(totalDuration);
  const [mediaType] = useState<"audio" | "video" | "unknown">("audio");
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

  const setBuffer = useCallback((buffer: AudioBuffer | null) => {
    audioBufferRef.current = buffer;
    setDuration(buffer?.duration || totalDuration);
  }, [totalDuration]);

  const stopSource = () => {
    isSeekingRef.current = true;
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setTimeout(() => { isSeekingRef.current = false; }, 0);
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
    }
  }, []);

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
    duration,
    mediaType,
    play,
    pause,
    seek,
    setBuffer,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
};

// Read-only state for all consumers
export function usePlaybackState() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlaybackState must be used within a PlaybackProvider");
  // Only return state, not mutators
  const { currentTime, isPlaying, duration, mediaType } = ctx;
  return { currentTime, isPlaying, duration, mediaType };
}

// Mutators for controls only
export function usePlaybackController() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlaybackController must be used within a PlaybackProvider");
  const { play, pause, seek, setBuffer } = ctx;
  return { play, pause, seek, setBuffer };
} 

export default PlaybackProvider; 