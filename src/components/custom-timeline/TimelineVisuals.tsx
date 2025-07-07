import React, { useMemo } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText, Group } from "react-konva";
import { ResponseRect } from "./ResponseRect";
import { getPaletteColor } from "./colorUtils";
import { trackIndexToCenterY, snapYToTrackIndex } from "./timelineMath";

// --- Types ---
export type TimelineResponse = {
  id: string;
  timestamp: number;
  duration: number;
  trackIndex: number;
  data: any;
  triggered: boolean;
};
export type Palette = {
  baseColor: string;
  borderColor: string;
  states: Record<string, { color: string; borderColor: string; opacity: number }>;
};
export type Palettes = Record<string, Palette>;
export type TrackTarget = { type: string; id: string } | undefined;
export type Geometry = {
  windowStart: number;
  windowDuration: number;
  tracksWidth: number;
  tracksTopOffset: number;
  trackHeight: number;
  trackGap: number;
  numTracks: number;
  totalDuration: number;
};

interface TimelineVisualsProps {
  numTracks: number;
  tracksWidth: number;
  tracksHeight: number;
  trackHeight: number;
  trackGap: number;
  tracksTopOffset: number;
  windowStart: number;
  windowDuration: number;
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
}

export const TimelineVisuals: React.FC<TimelineVisualsProps> = ({
  numTracks, tracksWidth, tracksHeight, trackHeight, trackGap, tracksTopOffset,
  windowStart, windowDuration, responses, hoveredId, selectedId, setHoveredId, setSelectedId,
  pointerHandler, palettes, trackTargets, activeRectIds, geometry, draggingId, draggingRectPos, currentTime
}) => {
  // Playhead X
  const playheadX = ((currentTime - windowStart) / windowDuration) * tracksWidth;
  // Ticks
  const majorTickEvery = 1;
  const minorTickEvery = 0.2;
  const ticks = useMemo(() => {
    const arr = [];
    for (let t = Math.ceil(windowStart / minorTickEvery) * minorTickEvery; t <= windowStart + windowDuration; t += minorTickEvery) {
      const isMajor = Math.abs(t % majorTickEvery) < 0.001 || Math.abs((t % majorTickEvery) - majorTickEvery) < 0.001;
      const x = ((t - windowStart) / windowDuration) * tracksWidth;
      arr.push({ t, x, isMajor });
    }
    return arr;
  }, [windowStart, windowDuration, majorTickEvery, minorTickEvery, tracksWidth]);
  const tracksTotalHeight = numTracks * trackHeight + (numTracks - 1) * trackGap;

  // Helper to get a fallback palette
  function getPaletteSafe(name: string): Palette {
    if (palettes[name]) return palettes[name];
    if (palettes['demo']) return palettes['demo'];
    const first = Object.values(palettes)[0];
    if (first) return first;
    // fallback
    return { baseColor: '#2196f3', borderColor: '#fff', states: {} };
  }

  return (
    <Stage
      width={tracksWidth}
      height={tracksHeight}
      style={{ background: '#181c22', borderRadius: 8 }}
      onMouseLeave={() => {
        setHoveredId(null);
      }}
    >
      <Layer>
        {/* Track backgrounds with midlines and subtle borders */}
        {[...Array(numTracks)].map((_, i) => {
          const y = tracksTopOffset + i * (trackHeight + trackGap);
          const isTrackAssigned = !!trackTargets[i];
          const fill = i % 2 === 0 ? '#23272f' : '#20232a';
          return (
            <Group key={i}>
              {/* Track background */}
              <Rect
                x={0}
                y={y}
                width={tracksWidth}
                height={trackHeight}
                fill={fill}
                cornerRadius={6}
                opacity={isTrackAssigned ? 1 : 0.7}
                stroke="#444"
                strokeWidth={2}
              />
              {/* Midline */}
              <Line
                points={[0, y + trackHeight / 2, tracksWidth, y + trackHeight / 2]}
                stroke="#333"
                strokeWidth={1}
                dash={[4, 4]}
              />
              {/* Track border bottom (except last) */}
              {i < numTracks - 1 && (
                <Line
                  points={[0, y + trackHeight, tracksWidth, y + trackHeight]}
                  stroke="#555"
                  strokeWidth={2}
                />
              )}
            </Group>
          );
        })}
        {/* Ticks and labels */}
        {ticks.map(({ t, x, isMajor }) => (
          <React.Fragment key={t.toFixed(2)}>
            <Line
              points={[x, tracksTopOffset, x, tracksTopOffset + tracksTotalHeight]}
              stroke={isMajor ? '#fff' : '#888'}
              strokeWidth={isMajor ? 2 : 1}
              dash={isMajor ? undefined : [2, 4]}
            />
            {isMajor && (
              <KonvaText
                x={x + 2}
                y={tracksTopOffset - 22}
                text={t.toFixed(1)}
                fontSize={14}
                fill="#fff"
              />
            )}
          </React.Fragment>
        ))}
        {/* Playhead */}
        <Line
          points={[playheadX, tracksTopOffset, playheadX, tracksTopOffset + tracksTotalHeight]}
          stroke="#FFD600"
          strokeWidth={3}
          dash={[8, 8]}
        />
        {/* Response rects */}
        {responses.map(rect => {
          const isTrackAssigned = !!trackTargets[rect.trackIndex];
          const isActive = isTrackAssigned && activeRectIds.includes(rect.id);
          const paletteName = String(rect.data?.paletteName || 'demo');
          const palette = getPaletteSafe(paletteName);
          let paletteState;
          if (!isTrackAssigned) paletteState = palette.states?.unassigned;
          else if (selectedId === rect.id) paletteState = palette.states?.selected;
          else if (hoveredId === rect.id) paletteState = palette.states?.hovered;
          else if (isActive) paletteState = palette.states?.active;
          if (!paletteState) paletteState = { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
          const { color, opacity } = getPaletteColor({
            baseColor: palette.baseColor,
            borderColor: palette.borderColor,
            state: paletteState,
          });
          const x = ((rect.timestamp - windowStart) / windowDuration) * tracksWidth;
          const y = tracksTopOffset + rect.trackIndex * (trackHeight + trackGap) + trackHeight / 2 - 16;
          const width = (rect.duration / windowDuration) * tracksWidth;
          const height = 32;
          const pointerHandlerRectProps = pointerHandler.getRectProps(rect.id) as Record<string, unknown>;
          delete pointerHandlerRectProps.hovered;
          delete pointerHandlerRectProps.selected;
          return (
            <ResponseRect
              key={rect.id}
              x={x}
              y={y}
              width={width}
              height={height}
              color={color}
              opacity={opacity}
              hovered={hoveredId === rect.id}
              selected={selectedId === rect.id}
              onGroupMouseEnter={() => setHoveredId(rect.id)}
              onGroupMouseLeave={() => setHoveredId(null)}
              onPointerDown={() => setSelectedId(rect.id)}
              {...pointerHandlerRectProps}
            />
          );
        })}
        {/* Shadow rect for dragging */}
        {draggingId && draggingRectPos && (() => {
          const draggingRect = responses.find(r => r.id === draggingId);
          if (!draggingRect) return null;
          const { x, y } = draggingRectPos;
          const snappedTrackIndex = snapYToTrackIndex(y, geometry);
          const snappedY = trackIndexToCenterY(snappedTrackIndex, geometry) - 16;
          const paletteName = String(draggingRect.data?.paletteName || 'demo');
          const palette = getPaletteSafe(paletteName);
          const paletteState = palette.states?.selected || { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
          const { color, opacity } = getPaletteColor({
            baseColor: palette.baseColor,
            borderColor: palette.borderColor,
            state: paletteState,
          });
          return (
            <ResponseRect
              x={x}
              y={snappedY}
              width={(draggingRect.duration / windowDuration) * tracksWidth}
              height={32}
              color={color}
              borderColor="#ff00ff"
              borderWidth={4}
              opacity={0.7 * (opacity ?? 1)}
              selected={false}
              hovered={false}
              dragging={true}
            />
          );
        })()}
      </Layer>
    </Stage>
  );
}; 