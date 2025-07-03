import React, { useEffect, useState } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText } from "react-konva";
import useTimelineState, { type TimelineResponse } from "./useTimelineState";
import { timeToXWindow, xToTime, yToTrackIndex, clampResponseDuration, getTimelinePointerInfo } from "./timelineMath";
import { usePlayback } from "./PlaybackContext";
import { useMeasuredContainerSize } from "./useMeasuredContainerSize";
import Track from "./Track";
import TracksColumn from "./TracksColumn";
import { useTimelinePointerHandler } from "./useTimelinePointerHandler";
import DebugInfo from "./DebugInfo";

export default function ResponseTimeline() {
  const {
    responses,
    addResponse,
    totalDuration,
    markResponsesTriggeredByPlayhead,
    resetAllTriggered,
  } = useTimelineState({ totalDuration: 15 });

  // Responsive sizing for tracks area only
  const aspectRatio = 16 / 5;
  const [tracksRef, { width: tracksWidth, height: tracksHeight }] = useMeasuredContainerSize({ aspectRatio, minWidth: 320, minHeight: 150 });
  const labelsWidth = Math.max(120, Math.min(240, (tracksWidth || 800) * 0.2));
  const width = (tracksWidth || 800) + labelsWidth;
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

  useEffect(() => {
    if (currentTime === 0) {
      resetAllTriggered();
    } else {
      markResponsesTriggeredByPlayhead(currentTime);
    }
  }, [currentTime, markResponsesTriggeredByPlayhead, resetAllTriggered]);

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
  function handleTracksClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const bounding = e.currentTarget.getBoundingClientRect();
    const pointerInfo = getTimelinePointerInfo({
      pointerX: e.clientX,
      pointerY: e.clientY,
      boundingRect: bounding,
      windowStart,
      windowDuration,
      tracksWidth: tracksWidth,
      tracksTopOffset,
      trackHeight,
      trackGap,
      numTracks,
      totalDuration,
    });
    if (!pointerInfo) return;
    const { time, trackIndex } = pointerInfo;
    let duration = Math.random() * (3.0 - 0.1) + 0.1;
    duration = clampResponseDuration(time, duration, totalDuration, 0.1);
    if (duration === 0) return;
    addResponse(time, duration, trackIndex, {});
  }

  // Find active rects (playhead is over them)
  const activeRectIds = responses.filter(
    r => currentTime >= r.timestamp && currentTime < r.timestamp + r.duration
  ).map(r => r.id);

  // Calculate playhead X position
  const playheadX = timeToXWindow({
    time: currentTime,
    windowStart,
    windowDuration,
    width: tracksWidth,
  });

  // Pointer/hover logic
  const { getTrackAreaProps, pointerState } = useTimelinePointerHandler({
    windowStart,
    windowDuration,
    tracksWidth: tracksWidth,
    tracksTopOffset,
    trackHeight,
    trackGap,
    numTracks,
    totalDuration,
    responses,
    onDragStart: (info, event) => {
      console.log("drag start", info, event);
    },
    onDragMove: (info, event) => {
      console.log("drag move", info, event);
    },
    onDragEnd: (info, event) => {
      console.log("drag end", info, event);
    },
    onHover: (info, event) => {
      console.log("hover", info, event);
    },
    onSelect: (info, event) => {
      console.log("select", info, event);
    },
    onContextMenu: (info, event) => {
      console.log("context menu", info, event);
    },
  });

  return (
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
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", width: "100%", maxWidth: 1000 }}>
        {/* Labels column, vertically centered with tracks */}
        <div style={{ width: labelsWidth, minWidth: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: tracksHeight, marginRight: 8 }}>
          {[...Array(numTracks)].map((_, i) => (
            <div key={i} style={{ height: trackHeight, marginTop: i === 0 ? tracksTopOffset : trackGap, color: '#fff', display: 'flex', alignItems: 'center', fontSize: 16, fontFamily: 'monospace' }}>
              Track {i + 1}
            </div>
          ))}
        </div>
        {/* Tracks area with aspect ratio */}
        <div
          ref={tracksRef}
          style={{ flex: 1, aspectRatio: `${aspectRatio}`, minWidth: 320, minHeight: 150, background: "#181c22", borderRadius: 8, position: "relative" }}
          onClick={handleTracksClick}
          {...getTrackAreaProps()}
        >
          <TracksColumn
            tracksWidth={tracksWidth}
            tracksHeight={tracksHeight}
            trackHeight={trackHeight}
            trackGap={trackGap}
            numTracks={numTracks}
            tracksTopOffset={tracksTopOffset}
            tracksTotalHeight={tracksTotalHeight}
            responses={responses}
            activeRectIds={activeRectIds}
            windowStart={windowStart}
            windowDuration={windowDuration}
            playheadX={playheadX}
            hoveredTrackIndex={pointerState.hoveredTrackIndex}
            hoveredResponseId={pointerState.hoveredResponseId}
          />
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
        <DebugInfo label="Pointer State" data={pointerState} />
      </div>
    </div>
  );
} 