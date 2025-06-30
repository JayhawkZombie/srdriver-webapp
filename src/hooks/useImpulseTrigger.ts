import { useRef, useEffect } from 'react';

/**
 * useImpulseTrigger
 * Calls the callback only when a new impulse is crossed (moving forward, deduped).
 * @param impulseTimes Array of impulse times (seconds)
 * @param playbackTime Current playback time (seconds)
 * @param callback Function to call when a new impulse is crossed (time: number, idx: number)
 */
export function useImpulseTrigger(
  impulseTimes: number[],
  playbackTime: number,
  callback: (time: number, idx: number) => void
) {
  const lastCursorRef = useRef<number>(-Infinity);
  const emittedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!Array.isArray(impulseTimes) || impulseTimes.length === 0) return;
    // Only trigger when moving forward
    if (playbackTime > lastCursorRef.current) {
      impulseTimes.forEach((time, idx) => {
        const key = `${time}`;
        if (
          !emittedRef.current.has(key) &&
          time > lastCursorRef.current &&
          time <= playbackTime
        ) {
          callback(time, idx);
          emittedRef.current.add(key);
        }
      });
    }
    lastCursorRef.current = playbackTime;
  }, [impulseTimes, playbackTime, callback]);
} 