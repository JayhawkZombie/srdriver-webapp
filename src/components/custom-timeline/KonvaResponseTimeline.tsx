import React from "react";
import { TimelineVisuals } from "./TimelineVisuals";
import type { TimelineResponse, Palettes, TrackTarget, Geometry } from "./TimelineVisuals";

interface KonvaResponseTimelineProps {
  responses: TimelineResponse[];
  hoveredId: string | null;
  selectedId: string | null;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
  pointerHandler: any;
  palettes: Palettes;
  trackTargets: TrackTarget[];
  activeRectIds: string[];
  geometry: Geometry;
  draggingId: string | null;
  draggingRectPos: { x: number; y: number } | null;
  currentTime: number;
  windowStart: number;
  windowDuration: number;
}

const labelWidth = 110;
const labelHeight = 32;
const tracksHeight = 300;
const numTracks = 3;
const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
const trackGap = 8;
const tracksTopOffset = 32;

export const KonvaResponseTimeline: React.FC<KonvaResponseTimelineProps> = ({
  responses,
  hoveredId,
  selectedId,
  setHoveredId,
  setSelectedId,
  pointerHandler,
  palettes,
  trackTargets,
  activeRectIds,
  geometry,
  draggingId,
  draggingRectPos,
  currentTime,
  windowStart,
  windowDuration,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: geometry.tracksWidth + labelWidth + 40,
        margin: "40px auto",
        background: "#23272f",
        borderRadius: 12,
        padding: 24,
      }}
    >
      {/* Track labels column */}
      <div
        style={{
          width: labelWidth,
          position: "relative",
          height: tracksHeight,
        }}
      >
        {[...Array(numTracks)].map((_, i) => {
          const y = tracksTopOffset + i * (trackHeight + trackGap) + trackHeight / 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: y - labelHeight / 2,
                left: 0,
                width: "100%",
                height: labelHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: "#fff",
                fontWeight: 500,
                fontFamily: "monospace",
                fontSize: 16,
                pointerEvents: "none",
              }}
            >
              Track {i + 1}
            </div>
          );
        })}
      </div>
      {/* Timeline Konva Stage column */}
      <div style={{ flex: 1 }}>
        <TimelineVisuals
          numTracks={numTracks}
          tracksWidth={geometry.tracksWidth}
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
          trackTargets={Array.isArray(trackTargets) ? trackTargets : Object.values(trackTargets)}
          activeRectIds={activeRectIds}
          geometry={geometry}
          draggingId={draggingId}
          draggingRectPos={draggingRectPos}
          currentTime={currentTime}
        />
      </div>
    </div>
  );
};

export default KonvaResponseTimeline; 