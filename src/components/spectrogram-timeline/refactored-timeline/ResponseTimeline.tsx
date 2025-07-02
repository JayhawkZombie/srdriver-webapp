import React from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText } from "react-konva";
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

const TRACK_HEIGHT = 60;
const TRACK_GAP = 8;
const NUM_TRACKS = 3;
// Single source of truth for vertical offset to first track
const TRACKS_TOP_OFFSET = 32; // px from top of timeline to first track
const TRACKS_TOTAL_HEIGHT = NUM_TRACKS * TRACK_HEIGHT + (NUM_TRACKS - 1) * TRACK_GAP;

// Minimal Track component
function Track({ y, height, label }: { y: number; height: number; label: string }) {
  return (
    <>
      {/* Track background */}
      <Rect x={0} y={y} width={TRACKS_WIDTH} height={height} fill="#23272f" cornerRadius={8} />
      {/* Track label (for debug) */}
      <KonvaText x={8} y={y + 8} text={label} fontSize={16} fill="#fff" />
    </>
  );
}

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

  // Ticks/grid lines
  const majorTickEvery = 1; // seconds
  const minorTickEvery = 0.2; // seconds
  const ticks = [];
  for (let t = Math.ceil(windowStart / minorTickEvery) * minorTickEvery; t <= windowEnd; t += minorTickEvery) {
    const isMajor = Math.abs(t % majorTickEvery) < 0.001 || Math.abs((t % majorTickEvery) - majorTickEvery) < 0.001;
    const x = timeToXWindow({ time: t, windowStart, windowDuration: WINDOW_DURATION, width: TRACKS_WIDTH });
    ticks.push({ t, x, isMajor });
  }

  return (
    <div style={{ width: CONTAINER_WIDTH, margin: "40px auto", background: "#222", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        {/* Labels column (empty for now) */}
        <div style={{ width: LABELS_WIDTH, minWidth: LABELS_WIDTH }} />
        {/* Tracks area */}
        <div style={{ position: "relative", width: TRACKS_WIDTH, height: TIMELINE_HEIGHT, background: "#181c22", borderRadius: 8 }}>
          <Stage width={TRACKS_WIDTH} height={TIMELINE_HEIGHT} style={{ position: "absolute", left: 0, top: 0 }}>
            {/* Grid/ticks layer */}
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
              {/* Debug: yellow at X=0, cyan at X=TRACKS_WIDTH */}
              <Line points={[0, TRACKS_TOP_OFFSET, 0, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]} stroke="#ffeb3b" strokeWidth={2} dash={[4, 2]} />
              <Line points={[TRACKS_WIDTH, TRACKS_TOP_OFFSET, TRACKS_WIDTH, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]} stroke="#00bcd4" strokeWidth={2} dash={[4, 2]} />
              {/* Debug: center line */}
              <Line points={[TRACKS_WIDTH/2, TRACKS_TOP_OFFSET, TRACKS_WIDTH/2, TRACKS_TOP_OFFSET + TRACKS_TOTAL_HEIGHT]} stroke="#fff176" strokeWidth={1} dash={[2, 2]} />
            </Layer>
            {/* Tracks layer */}
            <Layer>
              {[...Array(NUM_TRACKS)].map((_, i) => (
                <Track
                  key={i}
                  y={TRACKS_TOP_OFFSET + i * (TRACK_HEIGHT + TRACK_GAP)}
                  height={TRACK_HEIGHT}
                  label={`Track ${i + 1}`}
                />
              ))}
              {/* Playhead (red dashed line) */}
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
      {/* Debug info */}
      <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 16, marginTop: 12, textAlign: "center" }}>
        windowStart: {windowStart.toFixed(2)} | windowEnd: {windowEnd.toFixed(2)} | playhead: {playhead.toFixed(2)}
      </div>
    </div>
  );
} 