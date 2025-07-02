import { useState, useEffect, useRef, useCallback } from "react";

export interface TimelineResponse {
  id: string;
  timestamp: number;
  duration: number;
  trackIndex: number;
  data: Record<string, any>;
  triggered: boolean;
}

export interface UseTimelineStateOptions {
  totalDuration?: number;
  initialWindowDuration?: number;
}

const DEFAULT_TOTAL_DURATION = 15;
const DEFAULT_WINDOW_DURATION = 5;

export default function useTimelineState(options: UseTimelineStateOptions = {}) {
  const totalDuration = options.totalDuration ?? DEFAULT_TOTAL_DURATION;
  const initialWindowDuration = options.initialWindowDuration ?? DEFAULT_WINDOW_DURATION;

  const [playhead, setPlayhead] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const [windowDuration, setWindowDuration] = useState(initialWindowDuration);
  const [responses, setResponses] = useState<TimelineResponse[]>([]);

  // Animate playhead
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = (ts - start) / 1000;
      setPlayhead(Math.min(elapsed, totalDuration));
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [totalDuration]);

  // Auto-pan window so playhead stays centered, except at start/end
  useEffect(() => {
    let newWindowStart = playhead - windowDuration / 2;
    if (newWindowStart < 0) newWindowStart = 0;
    if (newWindowStart > totalDuration - windowDuration) newWindowStart = totalDuration - windowDuration;
    setWindowStart(newWindowStart);
  }, [playhead, windowDuration, totalDuration]);

  // Mark responses as triggered when playhead enters them (only once)
  useEffect(() => {
    setResponses(prev =>
      prev.map(r =>
        !r.triggered && playhead >= r.timestamp && playhead <= r.timestamp + r.duration
          ? { ...r, triggered: true }
          : r
      )
    );
  }, [playhead]);

  // Add a new response
  const addResponse = useCallback((timestamp: number, duration: number, trackIndex: number, data: Record<string, any> = {}) => {
    setResponses(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp,
        duration,
        trackIndex,
        data,
        triggered: false,
      },
    ]);
  }, []);

  // Mark a response as triggered by id
  const markResponseTriggered = useCallback((id: string) => {
    setResponses(prev => prev.map(r => (r.id === id ? { ...r, triggered: true } : r)));
  }, []);

  return {
    playhead,
    windowStart,
    windowDuration,
    setWindowDuration,
    responses,
    addResponse,
    markResponseTriggered,
    totalDuration,
  };
} 