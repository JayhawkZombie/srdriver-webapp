import React, { useEffect, useState, useRef } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText } from "react-konva";
import { timeToXWindow, clampResponseDuration, getTimelinePointerInfo, snapYToTrackIndex, trackIndexToCenterY } from "./timelineMath";
import type { TimelineGeometry } from "./timelineMath";
import { usePlayback } from "./PlaybackContext";
import { useMeasuredContainerSize } from "./useMeasuredContainerSize";
import Track from "./Track";
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import DebugInfo from "./DebugInfo";
import TimelineContextMenu from "./TimelineContextMenu";
import type { TimelineMenuAction } from "./TimelineContextMenu";
import {
  useTimelineResponses,
  useAddTimelineResponse,
  useUpdateTimelineResponse,
  useSetTimelineResponses,
  useTrackTargets,
  useSetTrackTarget,
} from "../../../store/appStore";
import { ResponseRect } from './ResponseRect';
import { useAppStore } from '../../../store/appStore';
import { ResponseTypeDragBar } from "./ResponseTypeDragBar";
import { getPaletteColor } from "./colorUtils";
import type { KonvaEventObject } from 'konva/lib/Node';
import { useAppStateLogger } from '../../../store/useAppStateLogger';

export default function ResponseTimeline({ actions }: { actions?: TimelineMenuAction[] }) {
  const responses = useTimelineResponses();
  const addTimelineResponse = useAddTimelineResponse();
  const updateTimelineResponse = useUpdateTimelineResponse();
  const setTimelineResponses = useSetTimelineResponses();
  const { totalDuration } = usePlayback();
  const trackTargets = useTrackTargets();
  const setTrackTarget = useSetTrackTarget();
  const deviceMetadata = useAppStore(state => state.deviceMetadata);
  const palettes = useAppStore(state => state.palettes);
  const log = useAppStateLogger('timeline');

  // Responsive sizing for tracks area only
  const aspectRatio = 16 / 5;
  const [tracksRef, { width: tracksWidth, height: tracksHeight }] = useMeasuredContainerSize({ aspectRatio, minWidth: 320, minHeight: 150 });
  const labelsWidth = Math.max(120, Math.min(240, (tracksWidth || 800) * 0.2));
  const height = tracksHeight || 300;
  const trackHeight = (height - 32 - 2 * 8) / 3 - 8;
  const trackGap = 8;
  const numTracks = 3;
  const tracksTopOffset = 32;
  const tracksTotalHeight = numTracks * trackHeight + (numTracks - 1) * trackGap;

  // Use global playback context for playhead
  const { currentTime } = usePlayback();

  // Window logic (auto-pan)
  const [windowDuration, setWindowDuration] = useState(5);
  const [windowStart, setWindowStart] = useState(0);
  useEffect(() => {
    let newWindowStart = currentTime - windowDuration / 2;
    if (newWindowStart < 0) newWindowStart = 0;
    if (newWindowStart > totalDuration - windowDuration) newWindowStart = totalDuration - windowDuration;
    setWindowStart(newWindowStart);
  }, [currentTime, windowDuration, totalDuration]);

  // Mark responses as triggered by playhead (global update)
  useEffect(() => {
    if (responses.length === 0) return;
    let changed = false;
    let newResponses;
    if (currentTime === 0) {
      newResponses = responses.map(r => {
        if (r.triggered) changed = true;
        return r.triggered ? { ...r, triggered: false } : r;
      });
    } else {
      newResponses = responses.map(r => {
        const shouldBeTriggered = currentTime >= r.timestamp && currentTime < r.timestamp + r.duration;
        if (shouldBeTriggered !== r.triggered) changed = true;
        return shouldBeTriggered !== r.triggered ? { ...r, triggered: shouldBeTriggered } : r;
      });
    }
    if (changed) setTimelineResponses(newResponses);
  }, [currentTime, responses, setTimelineResponses]);

  // Ticks/grid lines
  const majorTickEvery = 1;
  const minorTickEvery = 0.2;
  const ticks = [];
  for (let t = Math.ceil(windowStart / minorTickEvery) * minorTickEvery; t <= windowStart + windowDuration; t += minorTickEvery) {
    const isMajor = Math.abs(t % majorTickEvery) < 0.001 || Math.abs((t % majorTickEvery) - majorTickEvery) < 0.001;
    const x = timeToXWindow({ time: t, windowStart, windowDuration, width: tracksWidth });
    ticks.push({ t, x, isMajor });
  }

  // Click handler for tracks area
  function handleTracksClick(info: any, e: any) {
    // info already has time, trackIndex, etc.
    const { time, trackIndex } = info;
    let duration = Math.random() * (3.0 - 0.1) + 0.1;
    duration = clampResponseDuration(time, duration, totalDuration, 0.1);
    if (duration === 0) return;
    addTimelineResponse({
      id: crypto.randomUUID(),
      timestamp: time,
      duration,
      trackIndex,
      data: {},
      triggered: false,
    });
  }

  // Find active rects (playhead is over them) and track is assigned
  const activeRectIds = responses.filter(
    r =>
      currentTime >= r.timestamp &&
      currentTime < r.timestamp + r.duration &&
      !!trackTargets[r.trackIndex]
  ).map(r => r.id);

  // Calculate playhead X position
  const playheadX = timeToXWindow({
    time: currentTime,
    windowStart,
    windowDuration,
    width: tracksWidth,
  });

  const geometry: TimelineGeometry = {
    windowStart,
    windowDuration,
    tracksWidth: tracksWidth,
    tracksTopOffset,
    trackHeight,
    trackGap,
    numTracks,
    totalDuration,
  };

  const pointerHandler = useTimelinePointerHandler({
    ...geometry,
    responses,
    onBackgroundClick: handleTracksClick,
    onRectMove: (id, { timestamp, trackIndex, destroyAndRespawn }) => {
      if (destroyAndRespawn) {
        // Destroy-and-respawn logic
        const oldRect = responses.find(r => r.id === id);
        if (!oldRect) return;
        // Remove the old rect
        const newResponses = responses.filter(r => r.id !== id);
        // Add a new rect with the same data but updated timestamp and trackIndex
        const newRect = {
          ...oldRect,
          id: crypto.randomUUID(), // Optionally keep the same id if you want
          timestamp,
          trackIndex,
        };
        const finalResponses = [...newResponses, newRect];
        log.info('DAR: Destroyed rect', oldRect);
        log.info('DAR: Spawned new rect', newRect);
        setTimelineResponses(finalResponses);
      } else {
        log.info('onRectMove', { id, timestamp, trackIndex });
      updateTimelineResponse(id, { timestamp, trackIndex });
      }
    },
    onRectResize: (id, edge, newTimestamp, newDuration) => {
      if (edge === 'start') {
        updateTimelineResponse(id, { timestamp: newTimestamp, duration: newDuration });
      } else {
        updateTimelineResponse(id, { duration: newDuration });
      }
    },
  });

  // Context menu state
  const [menu, setMenu] = useState<{
    open: boolean;
    position: { x: number; y: number } | null;
    info: any;
    type: 'rect' | 'bg' | null;
  }>({
    open: false,
    position: null,
    info: null,
    type: null,
  });
  const menuRef = useRef(null);

  // Context menu for background
  const handleStageContextMenu = (e: any) => {
    console.log('[DEBUG] handleStageContextMenu fired', e, e?.target?.name && e.target.name(), e?.evt);
    if (!e || !e.target || e.target.name() !== 'stage-bg') {
      console.log('[DEBUG] ContextMenu not on stage-bg:', e?.target?.name && e.target.name());
      return;
    }
    if (e.evt && typeof e.evt.preventDefault === 'function') e.evt.preventDefault();
    const boundingRect = e.target.getStage().container().getBoundingClientRect();
    const pointerX = e.evt.clientX;
    const pointerY = e.evt.clientY;
    console.log('[DEBUG] Stage context menu pointer:', { pointerX, pointerY });
    console.log('[DEBUG] Stage context menu geometry:', geometry);
    console.log('[DEBUG] About to call getTimelinePointerInfo', { pointerX, pointerY, boundingRect, geometry });
    const rawInfo = getTimelinePointerInfo({
      pointerX,
      pointerY,
      boundingRect,
      ...geometry,
    });
    console.log('[DEBUG] Stage context menu rawInfo:', rawInfo);
    // Map to TimelineResponse-like fields for context menu consistency
    const info = rawInfo ? {
      timestamp: rawInfo.time,
      trackIndex: rawInfo.trackIndex,
      // Optionally add duration, id, etc. if needed for menu actions
    } : {};
    setMenu({
      open: true,
      position: { x: pointerX, y: pointerY },
      info,
      type: 'bg',
    });
    console.log('[DEBUG] Opened context menu at', { x: pointerX, y: pointerY }, info);
  };

  // Context menu for rect
  const handleRectContextMenu = (rect: any, e: any) => {
    // If rect is a Konva node, find the corresponding timeline response
    if (rect && rect.attrs && rect.attrs.id) {
      const found = responses.find(r => r.id === rect.attrs.id);
      if (found) rect = found;
    }
    console.log('[DEBUG] handleRectContextMenu rect:', rect);
    e.evt.preventDefault();
    setMenu({
      open: true,
      position: { x: e.evt.clientX, y: e.evt.clientY },
      info: rect,
      type: 'rect',
    });
  };

  // Add rect on background click
  const handleStageClick = (e: any) => {
    console.log('[DEBUG] handleStageClick fired', e, e?.target?.name && e.target.name(), e?.evt);
    if (!e || !e.target || e.target.name() !== 'stage-bg') {
      console.log('[DEBUG] Click not on stage-bg:', e?.target?.name && e.target.name());
      return;
    }
    if (e.evt && typeof e.evt.preventDefault === 'function') e.evt.preventDefault();
    const boundingRect = e.target.getStage().container().getBoundingClientRect();
    const pointerX = e.evt.clientX;
    const pointerY = e.evt.clientY;
    const x = pointerX - boundingRect.left;
    const y = pointerY - boundingRect.top;
    console.log('[DEBUG] Click coords:', { pointerX, pointerY, x, y });
    // Calculate time and trackIndex from x/y
    const time = geometry.windowStart + (x / geometry.tracksWidth) * geometry.windowDuration;
    const trackIndex = Math.floor((y - geometry.tracksTopOffset) / (geometry.trackHeight + geometry.trackGap));
    console.log('[DEBUG] Computed time/track:', { time, trackIndex });
    if (trackIndex < 0 || trackIndex >= geometry.numTracks) {
      console.log('[DEBUG] Click outside valid track range:', trackIndex);
      return;
    }
    const defaultDuration = 1;
    const timestamp = Math.max(0, Math.min(time, geometry.totalDuration - defaultDuration));
    addTimelineResponse({
      id: crypto.randomUUID(),
      timestamp,
      duration: defaultDuration,
      trackIndex,
      data: {},
      triggered: false,
    });
    console.log('[DEBUG] Added response:', { timestamp, duration: defaultDuration, trackIndex });
  };

  // --- Drag-and-drop for palette rects ---
  const [dragShadow, setDragShadow] = useState<null | {
    paletteName: string;
    time: number;
    trackIndex: number;
  }>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paletteName = e.dataTransfer.getData("application/x-palette-type");
    if (!paletteName) return;
    const boundingRect = tracksRef.current?.getBoundingClientRect();
    if (!boundingRect) return;
    const x = e.clientX - boundingRect.left;
    const y = e.clientY - boundingRect.top;
    const time = geometry.windowStart + (x / geometry.tracksWidth) * geometry.windowDuration;
    const trackIndex = snapYToTrackIndex(y, geometry);
    setDragShadow({ paletteName, time, trackIndex });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paletteName = e.dataTransfer.getData("application/x-palette-type");
    if (!paletteName) return;
    const boundingRect = tracksRef.current?.getBoundingClientRect();
    if (!boundingRect) return;
    const x = e.clientX - boundingRect.left;
    const y = e.clientY - boundingRect.top;
    const time = geometry.windowStart + (x / geometry.tracksWidth) * geometry.windowDuration;
    const trackIndex = snapYToTrackIndex(y, geometry);
    const defaultDuration = 1;
    const timestamp = Math.max(0, Math.min(time, geometry.totalDuration - defaultDuration));

    // Debug log: log everything relevant for diagnosing drop/shadow/geometry issues
    console.log('[DROP DEBUG]', {
      x, y, time, trackIndex, timestamp,
      dragShadow,
      geometry: { ...geometry },
      boundingRect,
      placing: { timestamp, trackIndex },
    });

    addTimelineResponse({
      id: crypto.randomUUID(),
      timestamp,
      duration: defaultDuration,
      trackIndex,
      data: { paletteName },
      triggered: false,
    });
    setDragShadow(null);

    // --- ALTERNATIVE: Destroy original rect and spawn a new one at the shadow position ---
    // If you want to implement this for dragging existing rects:
    // 1. Remove the original rect from state (by id)
    // 2. Add a new rect with the same data, but with timestamp/trackIndex from the shadow
    // This is not implemented here, but can be added if needed for a workaround.
  };

  const handleDragLeave = () => setDragShadow(null);

  return (
    <div style={{ width: '100%' }}>
      <ResponseTypeDragBar />
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "40px auto",
        background: "#222",
        borderRadius: 12,
        padding: 24,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Timeline row: labels + tracks */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", width: "100%", maxWidth: 1200 }}>
          {/* Labels column, now with dropdowns */}
        <div style={{ width: labelsWidth, minWidth: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: tracksHeight, marginRight: 8 }}>
            {[...Array(numTracks)].map((_, i) => {
              const target = trackTargets[i];
              let value = '';
              if (target) {
                if (target.type === 'device') value = target.id;
                else value = target.id; // fallback for other types
              }
              return (
            <div key={i} style={{ height: trackHeight, marginTop: i === 0 ? tracksTopOffset : trackGap, color: '#fff', display: 'flex', alignItems: 'center', fontSize: 16, fontFamily: 'monospace' }}>
                  <select
                    value={value}
                    onChange={e => {
                      const val = e.target.value;
                      if (val) {
                        setTrackTarget(i, { type: 'device', id: val });
                      } else {
                        setTrackTarget(i, undefined as any);
                      }
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
        {/* Tracks area with aspect ratio */}
        <div
          ref={tracksRef}
          style={{ flex: 1, minWidth: 0, display: "flex" }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
        >
          <div
            style={{ width: "100%", aspectRatio: `${aspectRatio}`, minWidth: 320, minHeight: 150, background: "#181c22", borderRadius: 8, position: "relative" }}
          >
            <Stage
              width={tracksWidth}
              height={tracksHeight}
              style={{ position: "absolute", left: 0, top: 0 }}
              onClick={handleStageClick}
              onContextMenu={handleStageContextMenu}
            >
              <Layer>
                {/* Background shape for hit testing */}
                <Rect
                  name="stage-bg"
                  x={0}
                  y={0}
                  width={tracksWidth}
                  height={tracksHeight}
                  fill="rgba(0,0,0,0)"
                  listening={true}
                />
                {/* Grid/tick lines */}
                {(() => {
                  const majorTickEvery = 1;
                  const minorTickEvery = 0.2;
                  const ticks = [];
                  for (let t = Math.ceil(windowStart / minorTickEvery) * minorTickEvery; t <= windowStart + windowDuration; t += minorTickEvery) {
                    const isMajor = Math.abs(t % majorTickEvery) < 0.001 || Math.abs((t % majorTickEvery) - majorTickEvery) < 0.001;
                    const x = ((t - windowStart) / windowDuration) * tracksWidth;
                    ticks.push({ t, x, isMajor });
                  }
                  return (
                    <>
                      {ticks.map(({ t, x, isMajor }) => (
                        <React.Fragment key={t.toFixed(2)}>
                          <Line
                            points={[x, tracksTopOffset, x, tracksTopOffset + tracksTotalHeight]}
                            stroke={isMajor ? "#fff" : "#888"}
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
                      {/* Boundary lines */}
                      <Line points={[0, tracksTopOffset, 0, tracksTopOffset + tracksTotalHeight]} stroke="#ffeb3b" strokeWidth={2} dash={[4, 2]} />
                      <Line points={[tracksWidth, tracksTopOffset, tracksWidth, tracksTopOffset + tracksTotalHeight]} stroke="#00bcd4" strokeWidth={2} dash={[4, 2]} />
                      <Line points={[tracksWidth/2, tracksTopOffset, tracksWidth/2, tracksTopOffset + tracksTotalHeight]} stroke="#fff176" strokeWidth={1} dash={[2, 2]} />
                    </>
                  );
                })()}
                  {/* Track backgrounds and overlays */}
                  {[...Array(numTracks)].map((_, i) => {
                    const isTrackAssigned = !!trackTargets[i];
                    const y = tracksTopOffset + i * (trackHeight + trackGap);
                    return (
                      <React.Fragment key={i}>
                  <Track
                          y={y}
                    height={trackHeight}
                          label={``}
                    width={tracksWidth}
                    listening={false}
                          styleOverride={{ fill: isTrackAssigned ? undefined : '#23272f' }}
                          showMidline={true}
                        />
                        {!isTrackAssigned && (
                          <KonvaText
                            x={tracksWidth / 2 - 150}
                            y={y + trackHeight / 2 - 18}
                            text="Unassigned"
                            fontSize={24}
                            fill="#bbb"
                            fontStyle="bold"
                            width={300}
                            align="center"
                  />
                        )}
                      </React.Fragment>
                    );
                  })}
                {/* Playhead line */}
                <Line
                  points={[playheadX, tracksTopOffset, playheadX, tracksTopOffset + tracksTotalHeight]}
                  stroke="#ffeb3b"
                  strokeWidth={3}
                  dash={[6, 4]}
                />
                {/* Response rects */}
                {responses.map(rect => {
                    const isTrackAssigned = !!trackTargets[rect.trackIndex];
                    const isActive = isTrackAssigned && activeRectIds.includes(rect.id);
                    // Dynamic palette assignment: use rect.data.paletteName if present, else 'demo'
                    const paletteName = rect.data?.paletteName || 'demo';
                    const palette = palettes[paletteName] || palettes['demo'] || Object.values(palettes)[0];
                    let paletteState;
                    if (!isTrackAssigned) paletteState = palette.states.unassigned;
                    else if (pointerHandler.getRectProps(rect.id).selected) paletteState = palette.states.selected;
                    else if (pointerHandler.getRectProps(rect.id).hovered) paletteState = palette.states.hovered;
                    else if (isActive) paletteState = palette.states.active;
                    else paletteState = { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
                    const { color, borderColor, opacity } = getPaletteColor({
                      baseColor: palette.baseColor,
                      borderColor: palette.borderColor,
                      state: paletteState,
                    });
                  const rectProps = {
                      x: ((rect.timestamp - windowStart) / windowDuration) * tracksWidth,
                      y: tracksTopOffset + rect.trackIndex * (trackHeight + trackGap) + trackHeight / 2 - 16,
                      width: (rect.duration / windowDuration) * tracksWidth,
                      height: 32,
                    color,
                    borderColor,
                      opacity,
                    ...pointerHandler.getRectProps(rect.id),
                      onContextMenu: (e: KonvaEventObject<PointerEvent>) => handleRectContextMenu(rect, e),
                  };
                  return <ResponseRect key={rect.id} {...rectProps} />;
                })}
                  {/* Shadow rect for drag-over from palette */}
                  {dragShadow && palettes[dragShadow.paletteName] && (
                    (() => {
                      const palette = palettes[dragShadow.paletteName];
                      const paletteState = palette.states.selected || { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
                      const { color, borderColor, opacity } = getPaletteColor({
                        baseColor: palette.baseColor,
                        borderColor: palette.borderColor,
                        state: paletteState,
                      });
                      const x = ((dragShadow.time - windowStart) / windowDuration) * tracksWidth;
                      const y = trackIndexToCenterY(dragShadow.trackIndex, geometry) - 16;
                      return (
                        <ResponseRect
                          x={x}
                          y={y}
                          width={tracksWidth * 0.15}
                          height={32}
                          color={color}
                          borderColor={borderColor}
                          opacity={0.35 * (opacity ?? 1)}
                          selected={false}
                          hovered={false}
                          dragging={true}
                        />
                      );
                    })()
                  )}
                  {/* Shadow rect for dragging existing rect */}
                  {pointerHandler.pointerState.draggingId && pointerHandler.draggingRectPos && (() => {
                    const draggingRect = responses.find(r => r.id === pointerHandler.pointerState.draggingId);
                    if (!draggingRect) return null;
                    const { x, y } = pointerHandler.draggingRectPos;
                    // Snap y to nearest track based on current drag position
                    const snappedTrackIndex = snapYToTrackIndex(y, geometry);
                    const snappedY = trackIndexToCenterY(snappedTrackIndex, geometry) - 16;
                    const paletteName = draggingRect.data?.paletteName || 'demo';
                    const palette = palettes[paletteName] || palettes['demo'] || Object.values(palettes)[0];
                    const paletteState = palette.states.selected || { color: palette.baseColor, borderColor: palette.borderColor, opacity: 1 };
                    const { color, borderColor, opacity } = getPaletteColor({
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
                        borderColor="#ff00ff" // Magenta for high contrast
                        borderWidth={4} // Make border thick (add to ResponseRect if needed)
                        opacity={0.7 * (opacity ?? 1)} // More visible
                        selected={false}
                        hovered={false}
                        dragging={true}
                      />
                    );
                  })()}
              </Layer>
            </Stage>
            <TimelineContextMenu
              isOpen={menu.open}
              position={menu.position}
              info={menu.info}
              onClose={() => setMenu({ open: false, position: null, info: null, type: null })}
              menuRef={menuRef}
              actions={actions}
            />
          </div>
        </div>
      </div>
      {/* Info and controls below timeline */}
      <div style={{ width: "100%", maxWidth: 1000, marginTop: 16 }}>
        <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 16, textAlign: "center" }}>
          windowStart: {windowStart.toFixed(2)} | windowEnd: {(windowStart + windowDuration).toFixed(2)} | playhead: {currentTime.toFixed(2)}
        </div>
        <div style={{ color: "#fffde7", fontFamily: "monospace", fontSize: 15, marginTop: 4, textAlign: "center" }}>
          Responses: [
          {responses.map(r => `{"id":${JSON.stringify(r.id)},"t":${r.timestamp.toFixed(2)},"d":${r.duration.toFixed(2)},"track":${r.trackIndex},"triggered":${r.triggered}}`).join(", ")}
          ]
        </div>
        <div style={{ color: "#ff9800", fontFamily: "monospace", fontSize: 15, marginTop: 4, textAlign: "center" }}>
          Active rects: [{activeRectIds.join(", ")}]
        </div>
        <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 16, marginTop: 16, textAlign: "center" }}>
          <label>
            Window size (seconds):
            <input
              type="range"
              min={1}
              max={15}
              step={0.1}
              value={windowDuration}
              onChange={e => setWindowDuration(Number(e.target.value))}
              style={{ margin: "0 12px", verticalAlign: "middle" }}
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
        <DebugInfo label="Pointer State" data={pointerHandler.pointerState} />
        </div>
      </div>
    </div>
  );
} 