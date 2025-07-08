import React, { useMemo, useRef } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText, Group } from "react-konva";
import { ResponseRect } from "./ResponseRect";
import { getPaletteColor } from "./colorUtils";
import type { TimelinePointerInfo } from './useTimelinePointerHandler';
import TimelineContextMenu from './TimelineContextMenu';
import { useTimelinePointerHandler } from './useTimelinePointerHandler';

// --- Types ---
export type TimelineResponse = {
  id: string;
  timestamp: number;
  duration: number;
  trackIndex: number;
  data: Record<string, unknown>;
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

// Add types for context info and actions
export type TimelineContextInfo =
  | { type: 'background'; time: number; trackIndex: number }
  | { type: 'rect'; rect: TimelineResponse };

export type TimelineMenuAction = {
  key: string;
  text: string;
  icon?: string;
  onClick?: (info: TimelineContextInfo) => void;
  disabled?: boolean;
  hidden?: boolean;
  submenu?: TimelineMenuAction[];
  divider?: boolean;
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
  palettes: Palettes;
  trackTargets: TrackTarget[];
  activeRectIds: string[];
  geometry: Geometry;
  currentTime: number;
  onBackgroundClick?: (args: TimelinePointerInfo) => void;
  onRectMove?: (id: string, args: { timestamp: number; trackIndex: number; destroyAndRespawn?: boolean }) => void;
  onRectResize?: (id: string, edge: 'start' | 'end', newTimestamp: number, newDuration: number) => void;
  onContextMenu?: (info: TimelineContextInfo, event: MouseEvent) => void;
  actions: TimelineMenuAction[];
}

export const TimelineVisuals: React.FC<TimelineVisualsProps> = (props) => {
  const { /* actions, */ ...rest } = props;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [menuInfo, setMenuInfo] = React.useState<TimelineContextInfo | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // --- Pointer/drag/resize/selection logic ---
  const pointerHandler = useTimelinePointerHandler({
    ...rest.geometry,
    responses: rest.responses,
    onRectMove: (id: string, args: { timestamp: number; trackIndex: number; destroyAndRespawn?: boolean }) => {
      // Call up to dashboard to update responses
      if (typeof rest.onRectMove === 'function') {
        rest.onRectMove(id, args);
      }
    },
    onRectResize: (id, edge, newTimestamp, newDuration) => {
      if (typeof rest.onRectResize === 'function') {
        rest.onRectResize(id, edge, newTimestamp, newDuration);
      }
    },
    onContextMenu: (info, event) => {
      pointerHandler.resetPointerState();
      setMenuOpen(true);
      if (info.type === 'rect') {
        // Look up the full TimelineResponse for this rect
        const fullRect = rest.responses.find(r => r.id === info.rect.id);
        if (fullRect) {
          setMenuInfo({ type: 'rect', rect: fullRect });
        } else {
          setMenuInfo(info); // fallback
        }
        if (event && typeof event === 'object' && 'evt' in event) {
          setMenuPosition({ x: (event as any).evt.clientX, y: (event as any).evt.clientY });
        }
      } else if (info.type === 'background') {
        setMenuInfo(info);
        if (event && typeof event === 'object' && 'evt' in event) {
          setMenuPosition({ x: (event as any).evt.clientX, y: (event as any).evt.clientY });
        }
      }
    },
    onBackgroundClick: rest.onBackgroundClick,
  });

  // When closing the menu, also reset pointer state
  const handleMenuClose = () => {
    pointerHandler.resetPointerState();
    setMenuOpen(false);
  };

  // Context menu handler for background
  const handleBackgroundContextMenu = (evt: unknown) => {
    if (
      typeof evt === "object" &&
      evt !== null &&
      "evt" in evt &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (evt as any).evt.preventDefault === "function"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (evt as any).evt.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = (evt as any).target;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stage = target && typeof target.getStage === "function" ? target.getStage() : null;
      if (!stage) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pointerPos = stage.getPointerPosition ? stage.getPointerPosition() : null;
      if (!pointerPos) return;
      const x = pointerPos.x;
      const y = pointerPos.y;
      const { windowStart, windowDuration, tracksWidth, tracksTopOffset, trackHeight, trackGap, numTracks } = rest;
      const time = windowStart + (x / tracksWidth) * windowDuration;
      let trackIndex = Math.floor((y - tracksTopOffset) / (trackHeight + trackGap));
      if (trackIndex < 0) trackIndex = 0;
      if (trackIndex >= numTracks) trackIndex = numTracks - 1;
      const info: TimelineContextInfo = { type: 'background', time, trackIndex };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMenuOpen(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMenuPosition({ x: (evt as any).evt.clientX, y: (evt as any).evt.clientY });
      setMenuInfo(info);
    }
  };

  // Context menu handler for rects
  const handleRectContextMenu = (rect: TimelineResponse, evt: unknown) => {
    console.log("Handling rect context menu", rect, evt);
    if (
      typeof evt === "object" &&
      evt !== null &&
      "evt" in evt &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (evt as any).evt.preventDefault === "function"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (evt as any).evt.preventDefault();
      const info: TimelineContextInfo = { type: 'rect', rect };
      setMenuOpen(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMenuPosition({ x: (evt as any).evt.clientX, y: (evt as any).evt.clientY });
      setMenuInfo(info);
    }
  };

  // Single entry point for actions
  const getMenuActions = (info: TimelineContextInfo | null): TimelineMenuAction[] => {
    if (!info) return [];
    if (info.type === 'background') {
      return [
        {
          key: 'add',
          text: 'Add Response',
          onClick: () => {
            if (rest.onBackgroundClick) {
              console.log("BACKGROUND MENU ACTION", info);
              rest.onBackgroundClick({ time: info.time, trackIndex: info.trackIndex });
            }
            setMenuOpen(false);
          },
        },
      ];
    } else if (info.type === 'rect') {
      return [
        {
          key: 'delete',
          text: 'Delete',
          onClick: () => {
            console.log("RECT MENU ACTION");
            // You would call a delete handler here, e.g. via props
            setMenuOpen(false);
          },
        },
      ];
    }
    return [];
  };

  // Playhead X
  const playheadX = ((rest.currentTime - rest.windowStart) / rest.windowDuration) * rest.tracksWidth;
  // Ticks
  const majorTickEvery = 1;
  const minorTickEvery = 0.2;
  const ticks = useMemo(() => {
    const arr = [];
    for (let t = Math.ceil(rest.windowStart / minorTickEvery) * minorTickEvery; t <= rest.windowStart + rest.windowDuration; t += minorTickEvery) {
      const isMajor = Math.abs(t % majorTickEvery) < 0.001 || Math.abs((t % majorTickEvery) - majorTickEvery) < 0.001;
      const x = ((t - rest.windowStart) / rest.windowDuration) * rest.tracksWidth;
      arr.push({ t, x, isMajor });
    }
    return arr;
  }, [rest.windowStart, rest.windowDuration, majorTickEvery, minorTickEvery, rest.tracksWidth]);
  const tracksTotalHeight = rest.numTracks * rest.trackHeight + (rest.numTracks - 1) * rest.trackGap;

  // Helper to get a fallback palette
  function getPaletteSafe(name: string): Palette {
    if (rest.palettes[name]) return rest.palettes[name];
    if (rest.palettes['demo']) return rest.palettes['demo'];
    const first = Object.values(rest.palettes)[0];
    if (first) return first;
    // fallback
    return { baseColor: '#2196f3', borderColor: '#fff', states: {} };
  }

  return (
    <>
      <Stage
        width={rest.tracksWidth}
        height={rest.tracksHeight}
        style={{ background: '#181c22', borderRadius: 8 }}
        onMouseLeave={() => {
          rest.setHoveredId(null);
        }}
        {...pointerHandler.getTrackAreaProps()}
      >
        <Layer>
          {/* Track backgrounds with midlines and subtle borders */}
          {[...Array(rest.numTracks)].map((_, i) => {
            const y = rest.tracksTopOffset + i * (rest.trackHeight + rest.trackGap);
            const isTrackAssigned = !!rest.trackTargets[i];
            const fill = i % 2 === 0 ? '#23272f' : '#20232a';
            return (
              <Group key={i}>
                {/* Track background */}
                <Rect
                  x={0}
                  y={y}
                  width={rest.tracksWidth}
                  height={rest.trackHeight}
                  fill={fill}
                  cornerRadius={6}
                  opacity={isTrackAssigned ? 1 : 0.7}
                  stroke="#444"
                  strokeWidth={2}
                />
                {/* Midline */}
                <Line
                  points={[0, y + rest.trackHeight / 2, rest.tracksWidth, y + rest.trackHeight / 2]}
                  stroke="#333"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
                {/* Track border bottom (except last) */}
                {i < rest.numTracks - 1 && (
                  <Line
                    points={[0, y + rest.trackHeight, rest.tracksWidth, y + rest.trackHeight]}
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
                points={[x, rest.tracksTopOffset, x, rest.tracksTopOffset + tracksTotalHeight]}
                stroke={isMajor ? '#fff' : '#888'}
                strokeWidth={isMajor ? 2 : 1}
                dash={isMajor ? undefined : [2, 4]}
              />
              {isMajor && (
                <KonvaText
                  x={x + 2}
                  y={rest.tracksTopOffset - 22}
                  text={t.toFixed(1)}
                  fontSize={14}
                  fill="#fff"
                />
              )}
            </React.Fragment>
          ))}
          {/* Playhead */}
          <Line
            points={[playheadX, rest.tracksTopOffset, playheadX, rest.tracksTopOffset + tracksTotalHeight]}
            stroke="#FFD600"
            strokeWidth={3}
            dash={[8, 8]}
          />
          {/* Response rects */}
          {rest.responses.map(rect => {
            const isTrackAssigned = !!rest.trackTargets[rect.trackIndex];
            const isActive = isTrackAssigned && rest.activeRectIds.includes(rect.id);
            const paletteName = String(rect.data?.paletteName || 'demo');
            const palette = getPaletteSafe(paletteName);
            let paletteState;
            if (!isTrackAssigned) paletteState = palette.states?.unassigned;
            else if (rest.selectedId === rect.id) paletteState = palette.states?.selected;
            else if (rest.hoveredId === rect.id) paletteState = palette.states?.hovered;
            else if (isActive) paletteState = palette.states?.active;
            if (!paletteState) paletteState = { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
            const { color, opacity } = getPaletteColor({
              baseColor: palette.baseColor,
              borderColor: palette.borderColor,
              state: paletteState,
            });
            const x = ((rect.timestamp - rest.windowStart) / rest.windowDuration) * rest.tracksWidth;
            const y = rest.tracksTopOffset + rect.trackIndex * (rest.trackHeight + rest.trackGap) + rest.trackHeight / 2 - 16;
            const width = (rect.duration / rest.windowDuration) * rest.tracksWidth;
            const height = 32;
            return (
              <ResponseRect
                key={rect.id}
                x={x}
                y={y}
                width={width}
                height={height}
                color={color}
                opacity={opacity}
                hovered={rest.hoveredId === rect.id}
                selected={rest.selectedId === rect.id}
                {...pointerHandler.getRectProps(rect.id)}
                onContextMenu={(evt: unknown) => handleRectContextMenu(rect, evt)}
              />
            );
          })}
          {/* Shadow rect for dragging */}
          {pointerHandler.pointerState.draggingId && pointerHandler.draggingRectPos && (() => {
            const draggingRect = rest.responses.find(r => r.id === pointerHandler.pointerState.draggingId);
            if (!draggingRect) return null;
            const { x, y } = pointerHandler.draggingRectPos;
            // Snap y to track
            const snapYToTrackIndex = (window as unknown as { snapYToTrackIndex?: (y: number, geometry: typeof rest.geometry) => number }).snapYToTrackIndex;
            const snappedTrackIndex = snapYToTrackIndex
              ? snapYToTrackIndex(y, rest.geometry)
              : Math.round((y - rest.tracksTopOffset) / (rest.trackHeight + rest.trackGap));
            const snappedY = rest.tracksTopOffset + snappedTrackIndex * (rest.trackHeight + rest.trackGap) + rest.trackHeight / 2 - 16;
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
                width={(draggingRect.duration / rest.windowDuration) * rest.tracksWidth}
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
      <TimelineContextMenu
        isOpen={menuOpen}
        position={menuPosition}
        info={menuInfo}
        actions={getMenuActions(menuInfo)}
        onClose={handleMenuClose}
        menuRef={menuRef}
      />
    </>
  );
}; 