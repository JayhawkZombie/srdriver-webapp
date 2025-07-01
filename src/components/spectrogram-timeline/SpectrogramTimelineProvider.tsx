import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface SpectrogramTimelineContextType {
  audioBuffer: AudioBuffer | null;
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  windowStart: number;
  setWindowStart: (start: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
}

const SpectrogramTimelineContext = createContext<SpectrogramTimelineContextType | undefined>(undefined);

export const useSpectrogramTimeline = () => {
  const ctx = useContext(SpectrogramTimelineContext);
  if (!ctx) throw new Error('useSpectrogramTimeline must be used within SpectrogramTimelineProvider');
  return ctx;
};

export const SpectrogramTimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const [duration, setDuration] = useState(0);

  return (
    <SpectrogramTimelineContext.Provider value={{
      audioBuffer, setAudioBuffer,
      playing, setPlaying,
      currentTime, setCurrentTime,
      windowStart, setWindowStart,
      duration, setDuration,
    }}>
      {children}
    </SpectrogramTimelineContext.Provider>
  );
};

interface PlaybackContextType {
  playbackTime: number;
  setPlaybackTime: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (b: boolean) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <PlaybackContext.Provider value={{ playbackTime, setPlaybackTime, isPlaying, setIsPlaying }}>
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
}; 