import React from "react";
import { Stage, Layer, Line, Text as KonvaText } from "react-konva";
// Minimal timeToXWindow function
function timeToXWindow({ time, windowStart, windowDuration, width }: { time: number, windowStart: number, windowDuration: number, width: number }) {
  return ((time - windowStart) / windowDuration) * width;
}

const LABELS_WIDTH = 200;
const TRACKS_WIDTH = 800;
const CONTAINER_WIDTH = LABELS_WIDTH + TRACKS_WIDTH;
const TIMELINE_HEIGHT = 300;

const TOTAL_DURATION = 15; // total timeline duration in seconds
const WINDOW_DURATION = 5; // how much time is visible at once

export default function ResponseTimeline() {
  // Playhead time
  const [playhead, setPlayhead] = React.useState(0);
  // windowStart: leftmost visible time
  const [windowStart, setWindowStart] = React.useState(0);

  // Animate playhead
  React.useEffect(() => {
    let raf: number;
    let start: number | null = null;
    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = (ts - start) / 1000;
      setPlayhead(Math.min(elapsed, TOTAL_DURATION));
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-pan window so playhead stays centered, except at start/end
  React.useEffect(() => {
    // Center the playhead unless at start or end
    let newWindowStart = playhead - WINDOW_DURATION / 2;
    if (newWindowStart < 0) newWindowStart = 0;
    if (newWindowStart > TOTAL_DURATION - WINDOW_DURATION) newWindowStart = TOTAL_DURATION - WINDOW_DURATION;
    setWindowStart(newWindowStart);
  }, [playhead]);

  // Playhead X: always at center unless clamped
  let playheadX = TRACKS_WIDTH / 2;
  if (windowStart === 0) {
    // At start, playhead is at its true X
    playheadX = timeToXWindow({
      time: playhead,
      windowStart: 0,
      windowDuration: WINDOW_DURATION,
      width: TRACKS_WIDTH,
    });
  } else if (windowStart === TOTAL_DURATION - WINDOW_DURATION) {
    // At end, playhead is at its true X
    playheadX = timeToXWindow({
      time: playhead,
      windowStart,
      windowDuration: WINDOW_DURATION,
      width: TRACKS_WIDTH,
    });
  }

  const windowEnd = windowStart + WINDOW_DURATION;

  return (
    <div style={{ width: CONTAINER_WIDTH, margin: "40px auto", background: "#222", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        {/* Labels column (empty for now) */}
        <div style={{ width: LABELS_WIDTH, minWidth: LABELS_WIDTH }} />
        {/* Tracks area */}
        <div style={{ position: "relative", width: TRACKS_WIDTH, height: TIMELINE_HEIGHT, background: "#181c22", borderRadius: 8 }}>
          <Stage width={TRACKS_WIDTH} height={TIMELINE_HEIGHT} style={{ position: "absolute", left: 0, top: 0 }}>
            <Layer>
              {/* Playhead (red dashed line) */}
              <Line
                points={[playheadX, 0, playheadX, TIMELINE_HEIGHT]}
                stroke="#ff5252"
                strokeWidth={2}
                dash={[8, 6]}
              />
              {/* Debug: yellow at X=0, cyan at X=TRACKS_WIDTH */}
              <Line points={[0, 0, 0, TIMELINE_HEIGHT]} stroke="#ffeb3b" strokeWidth={2} dash={[4, 2]} />
              <Line points={[TRACKS_WIDTH, 0, TRACKS_WIDTH, TIMELINE_HEIGHT]} stroke="#00bcd4" strokeWidth={2} dash={[4, 2]} />
              {/* Debug: center line */}
              <Line points={[TRACKS_WIDTH/2, 0, TRACKS_WIDTH/2, TIMELINE_HEIGHT]} stroke="#fff176" strokeWidth={1} dash={[2, 2]} />
            </Layer>
          </Stage>
        </div>
      </div>
      {/* Debug info */}
      <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 16, marginTop: 12, textAlign: "center" }}>
        windowStart: {windowStart.toFixed(2)} | windowEnd: {windowEnd.toFixed(2)} | playhead: {playhead.toFixed(2)}
      </div>
    </div>
  );
} 