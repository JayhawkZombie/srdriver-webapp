import { useState, useCallback } from "react";

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
}

const DEFAULT_TOTAL_DURATION = 15;

export default function useTimelineState(options: UseTimelineStateOptions = {}) {
  const totalDuration = options.totalDuration ?? DEFAULT_TOTAL_DURATION;
  const [responses, setResponses] = useState<TimelineResponse[]>([]);

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

  // Reset all responses' triggered state
  const resetAllTriggered = useCallback(() => {
    setResponses(prev => prev.map(r => ({ ...r, triggered: false })));
  }, []);

  // Mark responses as triggered when playhead enters them (only once)
  const markResponsesTriggeredByPlayhead = useCallback((playhead: number) => {
    setResponses(prev =>
      prev.map(r =>
        !r.triggered && playhead >= r.timestamp && playhead < r.timestamp + r.duration
          ? { ...r, triggered: true }
          : r
      )
    );
  }, []);

  return {
    responses,
    addResponse,
    markResponseTriggered,
    resetAllTriggered,
    markResponsesTriggeredByPlayhead,
    totalDuration,
  };
} 