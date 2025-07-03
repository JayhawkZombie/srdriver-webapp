import React, { useEffect, useState } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText } from "react-konva";
import useTimelineState, { type TimelineResponse } from "./useTimelineState";
import { timeToXWindow, xToTime, yToTrackIndex, clampResponseDuration } from "./timelineMath";
import { usePlayback } from "./PlaybackContext";
import { useMeasuredContainerSize } from "./useMeasuredContainerSize";
import Track from "./Track";

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
    const x = e.clientX - bounding.left;
    const y = e.clientY - bounding.top;
    if (x < 0 || x > tracksWidth) return;
    const time = xToTime({ x, windowStart, windowDuration, width: tracksWidth });
    if (time < 0 || time > totalDuration) return;
    const trackIndex = yToTrackIndex(y, trackHeight, trackGap, tracksTopOffset, numTracks);
    if (trackIndex < 0) return;
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
        >
          <Stage width={tracksWidth} height={tracksHeight} style={{ position: "absolute", left: 0, top: 0 }}>
            <Layer>
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
              <Line points={[0, tracksTopOffset, 0, tracksTopOffset + tracksTotalHeight]} stroke="#ffeb3b" strokeWidth={2} dash={[4, 2]} />
              <Line points={[tracksWidth, tracksTopOffset, tracksWidth, tracksTopOffset + tracksTotalHeight]} stroke="#00bcd4" strokeWidth={2} dash={[4, 2]} />
              <Line points={[tracksWidth/2, tracksTopOffset, tracksWidth/2, tracksTopOffset + tracksTotalHeight]} stroke="#fff176" strokeWidth={1} dash={[2, 2]} />
            </Layer>
            <Layer>
              {[...Array(numTracks)].map((_, i) => (
                <Track
                  key={i}
                  y={tracksTopOffset + i * (trackHeight + trackGap)}
                  height={trackHeight}
                  label={`Track ${i + 1}`}
                  width={tracksWidth}
                />
              ))}
              {responses.map((resp) => {
                const x = timeToXWindow({ time: resp.timestamp, windowStart, windowDuration, width: tracksWidth });
                const y = tracksTopOffset + resp.trackIndex * (trackHeight + trackGap) + trackHeight / 2;
                const rectWidth = (resp.duration / windowDuration) * tracksWidth;
                const isActive = activeRectIds.includes(resp.id);
                return (
                  <React.Fragment key={resp.id}>
                    <Rect
                      x={x}
                      y={y - 14}
                      width={rectWidth}
                      height={28}
                      fill={isActive ? "#ff9800" : "#ffeb3b"}
                      stroke={isActive ? "#ff1744" : "#333"}
                      strokeWidth={2}
                      cornerRadius={6}
                    />
                    <KonvaText x={x + rectWidth + 6} y={y - 8} text={`dur: ${resp.duration.toFixed(2)}`} fontSize={12} fill="#fffde7" />
                  </React.Fragment>
                );
              })}
              {/* Playhead line */}
              <Line
                points={[playheadX, tracksTopOffset, playheadX, tracksTopOffset + tracksTotalHeight]}
                stroke="#ff5252"
                strokeWidth={2}
                dash={[8, 6]}
              />
            </Layer>
          </Stage>
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
      </div>
    </div>
  );
} 