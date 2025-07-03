import React, { useEffect, useState } from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText } from "react-konva";
import useTimelineState, { type TimelineResponse } from "./useTimelineState";
import { timeToXWindow, xToTime, yToTrackIndex, clampResponseDuration } from "./timelineMath";
import { usePlayback } from "./PlaybackContext";

const LABELS_WIDTH = 200;
const TRACKS_WIDTH = 800;
const CONTAINER_WIDTH = LABELS_WIDTH + TRACKS_WIDTH;
const TIMELINE_HEIGHT = 300;

const MIN_RESPONSE_DURATION = 0.1;
const MAX_RESPONSE_DURATION = 3.0;

const TRACK_HEIGHT = 60;
const TRACK_GAP = 8;
const NUM_TRACKS = 3;
const TRACKS_TOP_OFFSET = 32;
const TRACKS_TOTAL_HEIGHT = NUM_TRACKS * TRACK_HEIGHT + (NUM_TRACKS - 1) * TRACK_GAP;

function Track({ y, height, label }: { y: number; height: number; label: string }) {
  return (
    <>
      <Rect x={0} y={y} width={TRACKS_WIDTH} height={height} fill="#23272f" cornerRadius={8} />
      <KonvaText x={8} y={y + 8} text={label} fontSize={16} fill="#fff" />
    </>
  );
}

export default function ResponseTimeline() {
  const {
    responses,
    addResponse,
    totalDuration,
    markResponsesTriggeredByPlayhead,
    resetAllTriggered,
  } = useTimelineState({ totalDuration: 15 });

  // Use global playback context for playhead
  const { currentTime } = usePlayback();

  // Window logic (auto-pan)
  const [windowDuration, setWindowDuration] = useState(5);
  const [windowStart, setWindowStart] = useState(0);
  useEffect(() => {
    // Auto-pan window so playhead stays centered, except at start/end
    let newWindowStart = currentTime - windowDuration / 2;
    if (newWindowStart < 0) newWindowStart = 0;
    if (newWindowStart > totalDuration - windowDuration) newWindowStart = totalDuration - windowDuration;
    setWindowStart(newWindowStart);
  }, [currentTime, windowDuration, totalDuration]);

  // Mark responses as triggered as playhead passes through
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
    const x = timeToXWindow({ time: t, windowStart, windowDuration, width: TRACKS_WIDTH });
    ticks.push({ t, x, isMajor });
  }

  // Click handler for tracks area
  function handleTracksClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const bounding = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounding.left;
    const y = e.clientY - bounding.top;
    if (x < 0 || x > TRACKS_WIDTH) return;
    const time = xToTime({ x, windowStart, windowDuration, width: TRACKS_WIDTH });
    if (time < 0 || time > totalDuration) return;
    const trackIndex = yToTrackIndex(y, TRACK_HEIGHT, TRACK_GAP, TRACKS_TOP_OFFSET, NUM_TRACKS);
    if (trackIndex < 0) return;
    let duration = Math.random() * (MAX_RESPONSE_DURATION - MIN_RESPONSE_DURATION) + MIN_RESPONSE_DURATION;
    duration = clampResponseDuration(time, duration, totalDuration, MIN_RESPONSE_DURATION);
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
    width: TRACKS_WIDTH,
  });

  return (
    <div style={{ width: CONTAINER_WIDTH, margin: "40px auto", background: "#222", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ width: LABELS_WIDTH, minWidth: LABELS_WIDTH }} />
        <div
          style={{ position: "relative", width: TRACKS_WIDTH, height: TIMELINE_HEIGHT, background: "#181c22", borderRadius: 8 }}
          onClick={handleTracksClick}
        >
          <Stage width={TRACKS_WIDTH} height={TIMELINE_HEIGHT} style={{ position: "absolute", left: 0, top: 0 }}>
            <Layer>
              {ticks.map(({ t, x, isMajor }) => (
                <React.Fragment key={t.toFixed(2)}>
                  <Line
                    points={[x, TRACKS_TOP_OFFSET, x, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]}
                    stroke={isMajor ? "#fff" : "#888"}
                    strokeWidth={isMajor ? 2 : 1}
                    dash={isMajor ? undefined : [2, 4]}
                  />
                  {isMajor && (
                    <KonvaText
                      x={x + 2}
                      y={TRACKS_TOP_OFFSET - 22}
                      text={t.toFixed(1)}
                      fontSize={14}
                      fill="#fff"
                    />
                  )}
                </React.Fragment>
              ))}
              <Line points={[0, TRACKS_TOP_OFFSET, 0, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]} stroke="#ffeb3b" strokeWidth={2} dash={[4, 2]} />
              <Line points={[TRACKS_WIDTH, TRACKS_TOP_OFFSET, TRACKS_WIDTH, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]} stroke="#00bcd4" strokeWidth={2} dash={[4, 2]} />
              <Line points={[TRACKS_WIDTH/2, TRACKS_TOP_OFFSET, TRACKS_WIDTH/2, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]} stroke="#fff176" strokeWidth={1} dash={[2, 2]} />
            </Layer>
            <Layer>
              {[...Array(NUM_TRACKS)].map((_, i) => (
                <Track
                  key={i}
                  y={TRACKS_TOP_OFFSET + i * (TRACK_HEIGHT + TRACK_GAP)}
                  height={TRACK_HEIGHT}
                  label={`Track ${i + 1}`}
                />
              ))}
              {responses.map((resp) => {
                const x = timeToXWindow({ time: resp.timestamp, windowStart, windowDuration, width: TRACKS_WIDTH });
                const y = TRACKS_TOP_OFFSET + resp.trackIndex * (TRACK_HEIGHT + TRACK_GAP) + TRACK_HEIGHT / 2;
                const rectWidth = (resp.duration / windowDuration) * TRACKS_WIDTH;
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
                points={[playheadX, TRACKS_TOP_OFFSET, playheadX, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]}
                stroke="#ff5252"
                strokeWidth={2}
                dash={[8, 6]}
              />
            </Layer>
          </Stage>
        </div>
      </div>
      <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 16, marginTop: 12, textAlign: "center" }}>
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
  );
} 