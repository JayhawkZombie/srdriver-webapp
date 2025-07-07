import React, { useMemo, useState } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText, Group } from "react-konva";
import { useTimelineResponses, useAddTimelineResponse, useUpdateTimelineResponse, useSetTimelineResponses, useTrackTargets, useSetTrackTarget } from '../../../store/appStore';
import { usePlayback } from "./PlaybackContext";
import { useAppStore } from '../../../store/appStore';
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import { ResponseRect } from "./ResponseRect";
import { getPaletteColor } from "./colorUtils";
import { trackIndexToCenterY, snapYToTrackIndex } from "./timelineMath";

export default {
  title: "RefactoredTimeline/CustomKonvaResponseTimeline",
};

type Palette = {
  baseColor: string;
  borderColor: string;
  states: Record<string, { color: string; borderColor: string; opacity: number }>;
};

type Palettes = Record<string, Palette>;

type DeviceMetadata = Record<string, { browserId: string; name?: string }>;

export const CustomKonvaResponseTimeline = () => {
  // State and store hooks
  const responses = useTimelineResponses();
  const addTimelineResponse = useAddTimelineResponse();
  const updateTimelineResponse = useUpdateTimelineResponse();
  const setTimelineResponses = useSetTimelineResponses();
  const { totalDuration, currentTime } = usePlayback();
  const trackTargets = useTrackTargets();
  const setTrackTarget = useSetTrackTarget();
  const palettes: Palettes = useAppStore(state => state.palettes);
  const deviceMetadata: DeviceMetadata = useAppStore(state => state.deviceMetadata);

  // Timeline geometry
  const numTracks = 3;
  const tracksWidth = 900;
  const tracksHeight = 300;
  const trackHeight = (tracksHeight - 32 - 2 * 8) / numTracks - 8;
  const trackGap = 8;
  const tracksTopOffset = 32;
  const tracksTotalHeight = numTracks * trackHeight + (numTracks - 1) * trackGap;

  // Window logic
  const [windowDuration, setWindowDuration] = useState(5);
  const [windowStart, setWindowStart] = useState(0);
  React.useEffect(() => {
    let newWindowStart = currentTime - windowDuration / 2;
    if (newWindowStart < 0) newWindowStart = 0;
    if (newWindowStart > totalDuration - windowDuration) newWindowStart = totalDuration - windowDuration;
    setWindowStart(newWindowStart);
  }, [currentTime, windowDuration, totalDuration]);

  // Robust local state for hover/selection
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pointer handler for drag/resize/context menu
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
      if (edge === 'start') {
        updateTimelineResponse(id, { timestamp: newTimestamp, duration: newDuration });
      } else {
        updateTimelineResponse(id, { duration: newDuration });
      }
    },
    onBackgroundClick: ({ time, trackIndex }: { time: number; trackIndex: number }) => {
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
    // You can still use onContextMenu, etc.
  });

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
    <div style={{ width: tracksWidth + 40, margin: '40px auto', background: '#23272f', borderRadius: 12, padding: 24 }}>
      {/* Track assignment controls */}
      <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
        {[...Array(numTracks)].map((_, i) => {
          const target = trackTargets[i];
          let value = '';
          if (target) value = target.id;
          return (
            <div key={i} style={{ marginRight: 16, color: '#fff' }}>
              <label>Track {i + 1}: </label>
              <select
                value={value}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  if (val) setTrackTarget(i, { type: 'device', id: val });
                  else setTrackTarget(i, undefined as undefined);
                }}
                style={{ minWidth: 120, padding: 4, borderRadius: 4 }}
              >
                <option value="">Unassigned</option>
                {Object.values(deviceMetadata).map(device => (
                  <option key={device.browserId} value={device.browserId}>
                    {device.name || device.browserId}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {/* Timeline Konva Stage */}
      <Stage
        width={tracksWidth}
        height={tracksHeight}
        style={{ background: '#181c22', borderRadius: 8 }}
        onMouseLeave={() => {
          setHoveredId(null);
          // Optionally: setSelectedId(null);
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
            if (!isTrackAssigned) paletteState = palette.states.unassigned;
            else if (selectedId === rect.id) paletteState = palette.states.selected;
            else if (hoveredId === rect.id) paletteState = palette.states.hovered;
            else if (isActive) paletteState = palette.states.active;
            else paletteState = { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
            const { color, opacity } = getPaletteColor({
              baseColor: palette.baseColor,
              borderColor: palette.borderColor,
              state: paletteState,
            });
            const x = ((rect.timestamp - windowStart) / windowDuration) * tracksWidth;
            const y = tracksTopOffset + rect.trackIndex * (trackHeight + trackGap) + trackHeight / 2 - 16;
            const width = (rect.duration / windowDuration) * tracksWidth;
            const height = 32;
            // Only use local state for hovered/selected, do not spread from pointerHandler
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
                onGroupMouseEnter={() => {
                  console.log('onGroupMouseEnter', rect.id);
                  setHoveredId(rect.id);
                }}
                onGroupMouseLeave={() => {
                  console.log('onGroupMouseLeave', rect.id);
                  setHoveredId(null);
                }}
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
            const paletteState = palette.states.selected || { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
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
      {/* Controls below timeline */}
      <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
        windowStart: {windowStart.toFixed(2)} | windowEnd: {(windowStart + windowDuration).toFixed(2)} | playhead: {currentTime.toFixed(2)}
      </div>
      <div style={{ color: '#fffde7', fontFamily: 'monospace', fontSize: 15, marginTop: 4, textAlign: 'center' }}>
        Responses: [
        {responses.map(r => `{"id":${JSON.stringify(r.id)},"t":${r.timestamp.toFixed(2)},"d":${r.duration.toFixed(2)},"track":${r.trackIndex},"triggered":${r.triggered}}`).join(", ")}
        ]
      </div>
      <div style={{ color: '#ff9800', fontFamily: 'monospace', fontSize: 15, marginTop: 4, textAlign: 'center' }}>
        Active rects: [{activeRectIds.join(", ")}]
      </div>
      <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
        <label>
          Window size (seconds):
          <input
            type="range"
            min={1}
            max={15}
            step={0.1}
            value={windowDuration}
            onChange={e => setWindowDuration(Number(e.target.value))}
            style={{ margin: '0 12px', verticalAlign: 'middle' }}
          />
          <input
            type="number"
            min={1}
            max={15}
            step={0.1}
            value={windowDuration}
            onChange={e => setWindowDuration(Number(e.target.value))}
            style={{ width: 60, marginLeft: 8 }}
          />
        </label>
      </div>
    </div>
  );
}; 