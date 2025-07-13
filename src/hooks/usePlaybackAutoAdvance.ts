import { useCallback, useState } from "react";

/**
 * Hook to auto-advance playback time while playing, with imperative and declarative API.
 *
 * Usage:
 *   const { enabled, setEnabled, toggleAutoplay } = usePlaybackAutoAdvance();
 *   // <button onClick={toggleAutoplay}>Toggle</button>
 */
export function usePlaybackAutoAdvance(initialEnabled: boolean = false) {
  // No need to read isPlaying here; all animation is handled in PlaybackContext
  const [enabled, setEnabled] = useState(initialEnabled);
  // Imperative toggle function
  const toggleAutoplay = useCallback(() => setEnabled(e => !e), []);
  // No animation loop here; PlaybackContext handles all playback time updates.
  return { enabled, setEnabled, toggleAutoplay };
} 