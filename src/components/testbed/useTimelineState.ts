import { useState, useRef, useEffect, useCallback } from 'react';
import { xToTime, TRACK_HEIGHT, TRACK_GAP, TIMELINE_LEFT, TIMELINE_RIGHT_PAD } from './timelineMath';

export interface ResponseEvent {
  start: number;
  end: number;
  track: number;
}

export type TrackType = 'device' | 'frequency' | 'custom';

export interface Track {
  name: string;
  type: TrackType;
  color?: string;
}

export interface UseTimelineStateOptions {
  defaultTracks: Track[];
  duration: number;
  trackHeight?: number;
  trackGap?: number;
  defaultResponseDuration?: number;
}

export function useTimelineState({
  defaultTracks,
  duration,
  trackHeight = TRACK_HEIGHT,
  trackGap = TRACK_GAP,
  defaultResponseDuration = 1,
}: UseTimelineStateOptions) {
  const [responses, setResponses] = useState<ResponseEvent[]>([]);
  const [playhead, setPlayhead] = useState(0);
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [editingTrack, setEditingTrack] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingType, setEditingType] = useState<TrackType | null>(null);
  const [templateIdx, setTemplateIdx] = useState(0);
  const animRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const [underlay, setUnderlay] = useState<'None' | 'Waveform' | 'Frequency'>('None');
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [timelineSize, setTimelineSize] = useState({ width: 800, height: 400 });

  // Dynamically size timeline to fill parent
  useEffect(() => {
    const handleResize = () => {
      if (timelineContainerRef.current) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const neededHeight = 40 + tracks.length * (trackHeight + trackGap) + 20;
        setTimelineSize({
          width: Math.max(400, rect.width),
          height: Math.max(neededHeight, Math.min(rect.height, window.innerHeight * 0.7)),
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tracks.length, trackHeight, trackGap]);

  // Playhead animation
  const startPlayhead = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    const start = performance.now() - (playhead * 1000);
    const animate = (now: number) => {
      if (!playingRef.current) return;
      const t = Math.min((now - start) / 1000, duration);
      setPlayhead(t);
      if (t < duration) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        playingRef.current = false;
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [playhead, duration]);
  const stopPlayhead = useCallback(() => {
    playingRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);
  const resetPlayhead = useCallback(() => {
    stopPlayhead();
    setPlayhead(0);
  }, [stopPlayhead]);

  // Converts X coordinate to time (seconds)
  const xToTimeLocal = useCallback(
    (x: number) => xToTime({ x, duration, width: timelineSize.width }),
    [timelineSize.width, duration]
  );

  // Click to add response
  const handleStageClick = useCallback((e: import('konva/lib/Node').KonvaEventObject<PointerEvent>) => {
    if (editingTrack !== null) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const { x, y } = pointer;
    // Only allow clicks within the timeline area
    if (x < TIMELINE_LEFT || x > timelineSize.width - TIMELINE_RIGHT_PAD) return;
    for (let i = 0; i < tracks.length; i++) {
      const top = 40 + i * (trackHeight + trackGap);
      if (y >= top && y <= top + trackHeight) {
        let start = xToTimeLocal(x);
        start = Math.max(0, Math.min(duration - defaultResponseDuration, start));
        const end = Math.min(duration, start + defaultResponseDuration);
        setResponses(prev => [...prev, { start, end, track: i }]);
        break;
      }
    }
  }, [editingTrack, tracks.length, duration, xToTimeLocal, timelineSize.width, trackHeight, trackGap, defaultResponseDuration]);

  // Resize response
  const handleResize = useCallback((idx: number, edge: 'left' | 'right', newTime: number) => {
    setResponses(prev => prev.map((resp, i) => {
      if (i !== idx) return resp;
      if (edge === 'left') {
        const newStart = Math.max(0, Math.min(resp.end - 0.1, newTime));
        return { ...resp, start: newStart };
      } else {
        const newEnd = Math.min(duration, Math.max(resp.start + 0.1, newTime));
        return { ...resp, end: newEnd };
      }
    }));
  }, [duration]);

  // Track name editing
  const handleTrackNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  }, []);
  const handleTrackNameCommit = useCallback(() => {
    if (editingTrack !== null) {
      setTracks(prev => prev.map((track, i) =>
        i === editingTrack
          ? {
              ...track,
              name: editingValue.trim() || track.name,
              type: editingType ?? track.type,
            }
          : track
      ));
      setEditingTrack(null);
      setEditingValue('');
      setEditingType(null);
    }
  }, [editingTrack, editingValue, editingType]);

  // Template selection
  const handleTemplateSelect = useCallback((idx: number, templates: { name: string; tracks: { name: string; type: TrackType }[] }[]) => {
    setTemplateIdx(idx);
    setTracks(templates[idx].tracks.map(t => ({ ...t })));
    setEditingTrack(null);
    setEditingValue('');
    setEditingType(null);
  }, []);

  return {
    responses, setResponses,
    playhead, setPlayhead,
    tracks, setTracks,
    editingTrack, setEditingTrack,
    editingValue, setEditingValue,
    editingType, setEditingType,
    templateIdx, setTemplateIdx,
    animRef, playingRef,
    underlay, setUnderlay,
    timelineContainerRef, timelineSize, setTimelineSize,
    startPlayhead, stopPlayhead, resetPlayhead,
    xToTimeLocal,
    handleStageClick,
    handleResize,
    handleTrackNameChange,
    handleTrackNameCommit,
    handleTemplateSelect,
    trackHeight,
    trackGap,
    defaultResponseDuration,
  };
} 