// ResponseTimelineV2.tsx
//
// Plan of Attack for Rebuilding:
//
// Basic Layout & Rendering
// [ ] Track labels (left, vertically centered)
// [ ] Timeline rendering (right, using new renderer)
// [ ] Minimal state: responses, hover/selection, etc.
//
// Track Assignment & Controls
// [ ] Track assignment dropdowns
// [ ] Window size controls (slider/input)
// [ ] Add/remove/modify response rects
//
// Advanced Timeline Features
// [ ] Context menus (right-click on rects/background)
// [ ] Palette drag/drop (if needed)
// [ ] Drag/resize logic (already in pointer handler)
//
// Worker Manager & Profiling UI
// [ ] Dev UI for worker manager stats (active jobs, queue, etc.)
// [ ] Expose hooks or context for worker manager state
//
// Performance/Profiling Tools
// [ ] Add a floating or hideable panel for performance stats (frame time, update time, etc.)
// [ ] Integrate a JS profiling/plotting library

import React, { useState } from "react";
import { useTimelineResponses, useAddTimelineResponse, useUpdateTimelineResponse, useSetTimelineResponses, useTrackTargets, useSetTrackTarget } from '../../store/appStore';
import { usePlayback } from "./PlaybackContext";
import { useAppStore } from '../../store/appStore';
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import { CustomKonvaTimelineStage } from "./CustomKonvaResponseTimeline.stories";
import { Profiling } from '../utility/Profiling';

const labelWidth = 110;
const labelHeight = 32;

export const ResponseTimelineV2: React.FC = () => {
  // TODO: Replace with context/store as needed
  const responses = useTimelineResponses();
  const addTimelineResponse = useAddTimelineResponse();
  const updateTimelineResponse = useUpdateTimelineResponse();
  const setTimelineResponses = useSetTimelineResponses();
  const { totalDuration, currentTime } = usePlayback();
  const trackTargets = useTrackTargets();
  const setTrackTarget = useSetTrackTarget();
  const palettes = useAppStore(state => state.palettes);

  // Geometry
  const numTracks = 3;
  const tracksWidth = 900;
  const tracksHeight = 300;
  const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
  const trackGap = 8;
  const tracksTopOffset = 32;

  // Window logic
  const [windowDuration, setWindowDuration] = useState(5);
  const [windowStart, setWindowStart] = useState(0);
  React.useEffect(() => {
    let newWindowStart = currentTime - windowDuration / 2;
    if (newWindowStart < 0) newWindowStart = 0;
    if (newWindowStart > totalDuration - windowDuration) newWindowStart = totalDuration - windowDuration;
    setWindowStart(newWindowStart);
  }, [currentTime, windowDuration, totalDuration]);

  // Local UI state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pointer handler
  const pointerHandler = useTimelinePointerHandler({
    windowStart,
    windowDuration,
    tracksWidth,
    tracksTopOffset,
    trackHeight,
    trackGap,
    numTracks,
    totalDuration,
    responses,
    onRectMove: (id: string, { timestamp, trackIndex, destroyAndRespawn }: { timestamp: number; trackIndex: number; destroyAndRespawn?: boolean }) => {
      // TODO: Port drag/resize logic
      if (destroyAndRespawn) {
        const oldRect = responses.find(r => r.id === id);
        if (!oldRect) return;
        const newResponses = responses.filter(r => r.id !== id);
        const newRect = { ...oldRect, id: crypto.randomUUID(), timestamp, trackIndex };
        setTimelineResponses([...newResponses, newRect]);
      } else {
        updateTimelineResponse(id, { timestamp, trackIndex });
      }
    },
    onRectResize: (id: string, edge: 'start' | 'end', newTimestamp: number, newDuration: number) => {
      // TODO: Port resize logic
      if (edge === 'start') {
        updateTimelineResponse(id, { timestamp: newTimestamp, duration: newDuration });
      } else {
        updateTimelineResponse(id, { duration: newDuration });
      }
    },
    onBackgroundClick: ({ time, trackIndex }: { time: number; trackIndex: number }) => {
      // TODO: Port add rect logic
      const duration = 1;
      addTimelineResponse({
        id: crypto.randomUUID(),
        timestamp: time,
        duration,
        trackIndex,
        data: {},
        triggered: false,
      });
    },
    // TODO: Port context menu, drag/drop, etc.
  });

  // Active rects
  const activeRectIds = responses.filter(
    r => currentTime >= r.timestamp && currentTime < r.timestamp + r.duration && !!trackTargets[r.trackIndex]
  ).map(r => r.id);

  // Shadow rect for dragging
  const { draggingId } = pointerHandler.pointerState;
  const draggingRectPos = pointerHandler.draggingRectPos;

  // Geometry for rects
  const geometry = {
    windowStart,
    windowDuration,
    tracksWidth,
    tracksTopOffset,
    trackHeight,
    trackGap,
    numTracks,
    totalDuration,
  };

  // --- Layout: flex row, left for labels, right for timeline ---
  return (
    <>
      <Profiling />
      <div style={{ display: 'flex', flexDirection: 'row', width: tracksWidth + labelWidth + 40, margin: '40px auto', background: '#23272f', borderRadius: 12, padding: 24 }}>
        {/* Track labels column */}
        <div style={{ width: labelWidth, position: 'relative', height: tracksHeight }}>
          {[...Array(numTracks)].map((_, i) => {
            const y = tracksTopOffset + i * (trackHeight + trackGap) + trackHeight / 2;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: y - labelHeight / 2,
                  left: 0,
                  width: '100%',
                  height: labelHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  color: '#fff',
                  fontWeight: 500,
                  fontFamily: 'monospace',
                  fontSize: 16,
                  pointerEvents: 'none',
                }}
              >
                Track {i + 1}
              </div>
            );
          })}
        </div>
        {/* Timeline Konva Stage column */}
        <div style={{ flex: 1 }}>
          <CustomKonvaTimelineStage
            numTracks={numTracks}
            tracksWidth={tracksWidth}
            tracksHeight={tracksHeight}
            trackHeight={trackHeight}
            trackGap={trackGap}
            tracksTopOffset={tracksTopOffset}
            windowStart={windowStart}
            windowDuration={windowDuration}
            responses={responses}
            hoveredId={hoveredId}
            selectedId={selectedId}
            setHoveredId={setHoveredId}
            setSelectedId={setSelectedId}
            pointerHandler={pointerHandler}
            palettes={palettes}
            trackTargets={trackTargets}
            activeRectIds={activeRectIds}
            geometry={geometry}
            draggingId={draggingId}
            draggingRectPos={draggingRectPos}
            currentTime={currentTime}
            totalDuration={totalDuration}
          />
        </div>
        {/* TODO: Add controls, dev UI, profiling panel, etc. */}
      </div>
    </>
  );
}; 