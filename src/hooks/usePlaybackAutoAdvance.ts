import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayback } from "../components/spectrogram-timeline/refactored-timeline/PlaybackContext";

/**
 * Hook to auto-advance playback time while playing, with imperative and declarative API.
 *
 * Usage:
 *   const { enabled, setEnabled, toggleAutoplay } = usePlaybackAutoAdvance();
 *   // <button onClick={toggleAutoplay}>Toggle</button>
 */
export function usePlaybackAutoAdvance(initialEnabled: boolean = false, intervalMs: number = 16) {
  const { isPlaying, currentTime, setCurrentTime, totalDuration } = usePlayback();
  const [enabled, setEnabled] = useState(initialEnabled);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  // Imperative toggle function
  const toggleAutoplay = useCallback(() => setEnabled(e => !e), []);

  useEffect(() => {
    if (!enabled) return;
    if (!isPlaying) return;
    let rafId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000; // seconds
      lastTime = now;
      const next = currentTimeRef.current + dt;
      setCurrentTime(next >= totalDuration ? totalDuration : next);
      if (enabledRef.current && isPlaying && next < totalDuration) {
        currentTimeRef.current = next;
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isPlaying, totalDuration]);

  return { enabled, setEnabled, toggleAutoplay };
} 