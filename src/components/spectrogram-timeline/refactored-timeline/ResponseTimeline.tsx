import React from "react";
import { Stage, Layer, Line, Rect, Text as KonvaText, Circle } from "react-konva";
// Paired helpers for timeline math
function timeToXWindow({ time, windowStart, windowDuration, width }: { time: number, windowStart: number, windowDuration: number, width: number }) {
  return ((time - windowStart) / windowDuration) * width;
}
function xToTime({ x, windowStart, windowDuration, width }: { x: number, windowStart: number, windowDuration: number, width: number }) {
  return windowStart + (x / width) * windowDuration;
}

const LABELS_WIDTH = 200;
const TRACKS_WIDTH = 800;
const CONTAINER_WIDTH = LABELS_WIDTH + TRACKS_WIDTH;
const TIMELINE_HEIGHT = 300;

const TOTAL_DURATION = 15; // total timeline duration in seconds
// windowDuration is now state, easy to move to a hook later

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
  // windowDuration: how much time is visible horizontally
  const [windowDuration, setWindowDuration] = React.useState(5);
  // Dots placed by clicking (array of time values)
  const [dots, setDots] = React.useState<number[]>([]);

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
    let newWindowStart = playhead - windowDuration / 2;
    if (newWindowStart < 0) newWindowStart = 0;
    if (newWindowStart > TOTAL_DURATION - windowDuration) newWindowStart = TOTAL_DURATION - windowDuration;
    setWindowStart(newWindowStart);
  }, [playhead, windowDuration]);

  // Playhead X: always at center unless clamped
  let playheadX = TRACKS_WIDTH / 2;
  if (windowStart === 0) {
    // At start, playhead is at its true X
    playheadX = timeToXWindow({
      time: playhead,
      windowStart: 0,
      windowDuration,
      width: TRACKS_WIDTH,
    });
  } else if (windowStart === TOTAL_DURATION - windowDuration) {
    // At end, playhead is at its true X
    playheadX = timeToXWindow({
      time: playhead,
      windowStart,
      windowDuration,
      width: TRACKS_WIDTH,
    });
  }

  const windowEnd = windowStart + windowDuration;

  // Ticks/grid lines
  const majorTickEvery = 1; // seconds
  const minorTickEvery = 0.2; // seconds
  const ticks = [];
  for (let t = Math.ceil(windowStart / minorTickEvery) * minorTickEvery; t <= windowEnd; t += minorTickEvery) {
    const isMajor = Math.abs(t % majorTickEvery) < 0.001 || Math.abs((t % majorTickEvery) - majorTickEvery) < 0.001;
    const x = timeToXWindow({ time: t, windowStart, windowDuration, width: TRACKS_WIDTH });
    ticks.push({ t, x, isMajor });
  }

  // Click handler for tracks area
  function handleTracksClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const bounding = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounding.left;
    // Clamp to tracks area
    if (x < 0 || x > TRACKS_WIDTH) return;
    // Convert X to time using shared helper
    const time = xToTime({ x, windowStart, windowDuration, width: TRACKS_WIDTH });
    // Clamp to timeline duration
    if (time < 0 || time > TOTAL_DURATION) return;
    setDots(prev => [...prev, time]);
  }

  // Dots are drawn in Track 2 (middle track)
  const track2Y = TRACKS_TOP_OFFSET + 1 * (TRACK_HEIGHT + TRACK_GAP);
  const dotY = track2Y + TRACK_HEIGHT / 2;

  // Handler for window size change (easy to move to a hook later)
  const handleWindowDurationChange = (v: number) => {
    setWindowDuration(Math.max(1, Math.min(TOTAL_DURATION, v)));
  };

  return (
    <div style={{ width: CONTAINER_WIDTH, margin: "40px auto", background: "#222", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        {/* Labels column (empty for now) */}
        <div style={{ width: LABELS_WIDTH, minWidth: LABELS_WIDTH }} />
        {/* Tracks area */}
        <div
          style={{ position: "relative", width: TRACKS_WIDTH, height: TIMELINE_HEIGHT, background: "#181c22", borderRadius: 8 }}
          onClick={handleTracksClick}
        >
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
              {/* Dots in Track 2 */}
              {dots.map((t, i) => {
                const x = timeToXWindow({ time: t, windowStart, windowDuration, width: TRACKS_WIDTH });
                return <Circle key={i} x={x} y={dotY} radius={10} fill="#ffeb3b" stroke="#333" strokeWidth={2} />;
              })}
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
      {/* Dots debug info */}
      <div style={{ color: "#fffde7", fontFamily: "monospace", fontSize: 15, marginTop: 4, textAlign: "center" }}>
        Dots: [{dots.map(t => t.toFixed(2)).join(", ")}]
      </div>
      {/* Window size control */}
      <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 16, marginTop: 16, textAlign: "center" }}>
        <label>
          Window size (seconds):
          <input
            type="range"
            min={1}
            max={TOTAL_DURATION}
            step={0.1}
            value={windowDuration}
            onChange={e => handleWindowDurationChange(Number(e.target.value))}
            style={{ margin: "0 12px", verticalAlign: "middle" }}
          />
          <input
            type="number"
            min={1}
            max={TOTAL_DURATION}
            step={0.1}
            value={windowDuration}
            onChange={e => handleWindowDurationChange(Number(e.target.value))}
            style={{ width: 60, marginLeft: 8 }}
          />
        </label>
      </div>
      {/* Add more debug info here if needed */}
    </div>
  );
} 