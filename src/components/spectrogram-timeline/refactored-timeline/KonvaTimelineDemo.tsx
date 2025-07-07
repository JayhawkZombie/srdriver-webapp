import React, { useMemo } from "react";
import { Stage, Layer, Line, Text, Group } from "react-konva";
import { usePlayback } from "./PlaybackContext";

const TRACK_HEIGHT = 40;
const NUM_TRACKS = 3;
const TIMELINE_WIDTH = 800;
const TIMELINE_HEIGHT = TRACK_HEIGHT * NUM_TRACKS + 40;
const PLAYHEAD_COLOR = "#FFD600";
const BG_COLOR = "#23272f";
const TICK_COLOR = "#888";
const LABEL_COLOR = "#bbb";

const KonvaTimelineDemoComponent: React.FC = () => {
  const { currentTime } = usePlayback();
  const windowDuration = 5; // seconds
  const windowStart = Math.max(0, currentTime - windowDuration / 2);
  const windowEnd = windowStart + windowDuration;

  // Memoize ticks
  const tickInterval = 0.5;
  const ticks = useMemo(() => {
    const arr = [];
    for (let t = Math.ceil(windowStart / tickInterval) * tickInterval; t < windowEnd; t += tickInterval) {
      const x = ((t - windowStart) / windowDuration) * TIMELINE_WIDTH;
      arr.push({ t, x });
    }
    return arr;
  }, [windowStart, windowDuration, tickInterval, windowEnd]);

  // Memoize tracks
  const tracks = useMemo(() => [...Array(NUM_TRACKS)], []);

  // Playhead X
  const playheadX = ((currentTime - windowStart) / windowDuration) * TIMELINE_WIDTH;

  return (
    <div style={{ background: BG_COLOR, padding: 24, borderRadius: 12, width: TIMELINE_WIDTH }}>
      <Stage width={TIMELINE_WIDTH} height={TIMELINE_HEIGHT} style={{ background: BG_COLOR }}>
        <Layer>
          {/* Track backgrounds */}
          {tracks.map((_, i) => (
            <Line
              key={i}
              points={[0, 30 + i * TRACK_HEIGHT, TIMELINE_WIDTH, 30 + i * TRACK_HEIGHT]}
              stroke={TICK_COLOR}
              strokeWidth={1}
            />
          ))}
          {/* Ticks and labels */}
          {ticks.map((tick, i) => (
            <Group key={i}>
              <Line
                points={[tick.x, 20, tick.x, 20 + NUM_TRACKS * TRACK_HEIGHT]}
                stroke={TICK_COLOR}
                strokeWidth={1}
                dash={[4, 4]}
              />
              <Text
                x={tick.x - 12}
                y={5}
                text={tick.t.toFixed(1)}
                fontSize={12}
                fill={LABEL_COLOR}
                width={24}
                align="center"
              />
            </Group>
          ))}
          {/* Track labels */}
          {tracks.map((_, i) => (
            <Text
              key={i}
              x={8}
              y={30 + i * TRACK_HEIGHT + 8}
              text={`Track ${i + 1}`}
              fontSize={14}
              fill={LABEL_COLOR}
              opacity={0.5}
            />
          ))}
          {/* Playhead */}
          <Line
            points={[playheadX, 20, playheadX, 20 + NUM_TRACKS * TRACK_HEIGHT]}
            stroke={PLAYHEAD_COLOR}
            strokeWidth={3}
            dash={[8, 8]}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export const KonvaTimelineDemo = React.memo(KonvaTimelineDemoComponent); 