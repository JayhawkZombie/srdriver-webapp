import React, { useMemo, useRef } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText, Group } from "react-konva";
import { ResponseRect } from "./ResponseRect";
import { getPaletteColor } from "./colorUtils";
import type { TimelinePointerInfo, TimelineContextInfo } from './useTimelinePointerHandler';
import TimelineContextMenu, { type TimelineMenuAction } from './TimelineContextMenu';
import { useTimelinePointerHandler } from './useTimelinePointerHandler';
import type { RectTemplate, TimelineResponse, TrackTarget } from "../../store/appStore";
import type { ResponseRectPalette } from "../../types/ResponseRectPalette";
import type { TimelineGeometry } from "./timelineMath";
import { useAppStore } from "../../store/appStore";

// Type aliases for convenience
type Palettes = Record<string, ResponseRectPalette>;
type Palette = ResponseRectPalette;
type Geometry = TimelineGeometry & {
  galleryHeight?: number;
  totalHeight?: number;
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
  onGalleryRectPointerDown?: (template: RectTemplate, pointerPos: { x: number; y: number }) => void;
}

export const TimelineVisuals: React.FC<TimelineVisualsProps> = (props) => {
  const { /* actions, */ ...rest } = props;
  const rectTemplates = useAppStore(state => state.rectTemplates);
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
        }
        if (event && typeof event === 'object' && 'clientX' in event && 'clientY' in event) {
          setMenuPosition({ x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
        }
      } else if (info.type === 'background') {
        // Accept both 'timestamp' and 'time' for compatibility
        setMenuInfo({ type: 'background', time: info.time, trackIndex: info.trackIndex });
        if (event && typeof event === 'object' && 'clientX' in event && 'clientY' in event) {
          setMenuPosition({ x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY });
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
    if (first && typeof first === 'object' && 'baseColor' in first) return first;
    // fallback with proper states
    return { 
      baseColor: '#2196f3', 
      borderColor: '#fff', 
      states: {
        hovered: { color: '#42a5f5', borderColor: '#fff', hue: 210, borderHue: 0, opacity: 1 },
        selected: { color: '#1976d2', borderColor: '#fff', hue: 210, borderHue: 0, opacity: 1 },
        active: { color: '#1565c0', borderColor: '#fff', hue: 210, borderHue: 0, opacity: 1 },
        unassigned: { color: '#90caf9', borderColor: '#ccc', hue: 210, borderHue: 0, opacity: 0.7 }
      }
    };
  }

  return (
    <>
      <Stage
        width={rest.tracksWidth}
        height={props.geometry.totalHeight ?? (rest.tracksHeight + (props.geometry.galleryHeight ?? 48))}
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
                onContextMenu={(evt) => {
                  console.error("TIMELINE VISUALS onContextMenu", evt);
                  // Type guard for Konva synthetic event
                  const maybeKonva = evt as { evt?: MouseEvent; cancelBubble?: boolean; clientX?: number; clientY?: number };
                  if (maybeKonva.evt && typeof maybeKonva.evt.preventDefault === 'function') maybeKonva.evt.preventDefault();
                  if ('cancelBubble' in maybeKonva && maybeKonva.evt) maybeKonva.cancelBubble = true;
                  setMenuOpen(true);
                  if (maybeKonva.evt && 'clientX' in maybeKonva.evt && 'clientY' in maybeKonva.evt) {
                    setMenuPosition({ x: maybeKonva.evt.clientX, y: maybeKonva.evt.clientY });
                  }
                  setMenuInfo({ type: 'rect', rect });
                  console.log('Rendering context menu with info:', { type: 'rect', rect });
                }}
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
        actions={props.actions}
        onClose={handleMenuClose}
        menuRef={menuRef}
      />
    </>
  );
}; 