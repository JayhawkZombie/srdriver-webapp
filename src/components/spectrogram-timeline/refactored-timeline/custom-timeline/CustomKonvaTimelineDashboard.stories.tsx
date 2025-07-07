import React, { useState } from "react";
import TimelineHeader from "./TimelineHeader";
import TrackLabels from "./TrackLabels";
import { TimelineVisuals, TimelineResponse, Palettes, TrackTarget, Geometry } from "./TimelineVisuals";

export default {
  title: "CustomTimeline/CustomKonvaTimelineDashboard",
};

const numTracks = 3;
const trackNames = ["Drums", "Bass", "Synth"];
const tracksHeight = 300;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;
const tracksWidth = 900;
const labelWidth = 110;

// Mock palettes
const palettes: Palettes = {
  demo: {
    baseColor: "#2196f3",
    borderColor: "#fff",
    states: {
      selected: { color: "#ff9800", borderColor: "#fff", opacity: 1 },
      hovered: { color: "#4caf50", borderColor: "#fff", opacity: 1 },
      active: { color: "#e91e63", borderColor: "#fff", opacity: 1 },
      unassigned: { color: "#888", borderColor: "#fff", opacity: 0.5 },
    },
  },
};

export const CustomKonvaTimelineDashboard = () => {
  // Local state for demo
  const [currentTime, setCurrentTime] = useState(0);
  const [windowSize, setWindowSize] = useState(5);
  const [responses, setResponses] = useState<TimelineResponse[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingRectPos, setDraggingRectPos] = useState<{ x: number; y: number } | null>(null);
  const duration = 20;
  const trackTargets: TrackTarget[] = [
    { type: "device", id: "dev1" },
    { type: "device", id: "dev2" },
    undefined,
  ];
  const geometry: Geometry = {
    windowStart: Math.max(0, currentTime - windowSize / 2),
    windowDuration: windowSize,
    tracksWidth,
    tracksTopOffset,
    trackHeight,
    trackGap,
    numTracks,
    totalDuration: duration,
  };
  // Active rects
  const activeRectIds = responses.filter(
    r => currentTime >= r.timestamp && currentTime < r.timestamp + r.duration && !!trackTargets[r.trackIndex]
  ).map(r => r.id);

  // Handlers
  const handleSeek = (time: number) => setCurrentTime(time);
  const handleWindowSizeChange = (size: number) => setWindowSize(size);

  // Demo: add a rect on click
  const handleVisualsClick = (e: any) => {
    const boundingRect = e.target.getStage().container().getBoundingClientRect();
    const x = e.evt.clientX - boundingRect.left;
    const y = e.evt.clientY - boundingRect.top;
    const time = geometry.windowStart + (x / geometry.tracksWidth) * geometry.windowDuration;
    const trackIndex = Math.floor((y - geometry.tracksTopOffset) / (geometry.trackHeight + geometry.trackGap));
    if (trackIndex < 0 || trackIndex >= geometry.numTracks) return;
    setResponses(responses => [
      ...responses,
      {
        id: crypto.randomUUID(),
        timestamp: time,
        duration: 1,
        trackIndex,
        data: {},
        triggered: false,
      },
    ]);
  };

  return (
    <div style={{ width: tracksWidth + labelWidth + 40, margin: "40px auto", background: "#23272f", borderRadius: 12, padding: 24 }}>
      <TimelineHeader
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        windowSize={windowSize}
        onWindowSizeChange={handleWindowSizeChange}
      />
      <div style={{ display: "flex", flexDirection: "row", width: "100%", marginTop: 24 }}>
        <div style={{ width: labelWidth, position: "relative", height: tracksHeight }}>
          <TrackLabels
            numTracks={numTracks}
            trackNames={trackNames}
            height={tracksHeight}
            trackHeight={trackHeight}
            trackGap={trackGap}
            tracksTopOffset={tracksTopOffset}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TimelineVisuals
            numTracks={numTracks}
            tracksWidth={tracksWidth}
            tracksHeight={tracksHeight}
            trackHeight={trackHeight}
            trackGap={trackGap}
            tracksTopOffset={tracksTopOffset}
            windowStart={geometry.windowStart}
            windowDuration={geometry.windowDuration}
            responses={responses}
            hoveredId={hoveredId}
            selectedId={selectedId}
            setHoveredId={setHoveredId}
            setSelectedId={setSelectedId}
            pointerHandler={{ getRectProps: () => ({}) }}
            palettes={palettes}
            trackTargets={trackTargets}
            activeRectIds={activeRectIds}
            geometry={geometry}
            draggingId={draggingId}
            draggingRectPos={draggingRectPos}
            currentTime={currentTime}
          />
        </div>
      </div>
    </div>
  );
}; 