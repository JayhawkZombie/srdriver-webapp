import React from "react";
import { Stage, Layer, Rect, Line, Text as KonvaText } from "react-konva";
import Track from "./Track";
import type { KonvaEventObject } from 'konva/lib/Node';

interface TracksColumnProps {
  tracksWidth: number;
  tracksHeight: number;
  trackHeight: number;
  trackGap: number;
  numTracks: number;
  tracksTopOffset: number;
  tracksTotalHeight: number;
  responses: any[];
  activeRectIds: string[];
  windowStart: number;
  windowDuration: number;
  playheadX: number;
  hoveredTrackIndex: number | null;
  hoveredResponseId: string | null;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const TracksColumn: React.FC<TracksColumnProps> = ({
  tracksWidth,
  tracksHeight,
  trackHeight,
  trackGap,
  numTracks,
  tracksTopOffset,
  tracksTotalHeight,
  responses,
  activeRectIds,
  windowStart,
  windowDuration,
  playheadX,
  hoveredTrackIndex,
  hoveredResponseId,
  onContextMenu,
}) => {
  // Compute ticks/grid lines
  const majorTickEvery = 1;
  const minorTickEvery = 0.2;
  const ticks = [];
  for (let t = Math.ceil(windowStart / minorTickEvery) * minorTickEvery; t <= windowStart + windowDuration; t += minorTickEvery) {
    const isMajor = Math.abs(t % majorTickEvery) < 0.001 || Math.abs((t % majorTickEvery) - majorTickEvery) < 0.001;
    const x = ((t - windowStart) / windowDuration) * tracksWidth;
    ticks.push({ t, x, isMajor });
  }

  const handleStageContextMenu = (evt: KonvaEventObject<PointerEvent>) => {
    if (onContextMenu) {
      // Konva wraps the native event in evt.evt
      onContextMenu(evt.evt as unknown as React.MouseEvent);
    }
  };

  return (
    <Stage width={tracksWidth} height={tracksHeight} style={{ position: "absolute", left: 0, top: 0 }} onContextMenu={handleStageContextMenu}>
      <Layer>
        {/* Grid/tick lines */}
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
      </Layer>
      <Layer>
        {/* Track backgrounds with hover effect */}
        {[...Array(numTracks)].map((_, i) => (
          <Track
            key={i}
            y={tracksTopOffset + i * (trackHeight + trackGap)}
            height={trackHeight}
            label={`Track ${i + 1}`}
            width={tracksWidth}
            // Highlight hovered track
            styleOverride={hoveredTrackIndex === i ? { fill: "#2c3440" } : undefined}
          />
        ))}
        {/* Response rects with hover outline */}
        {responses.map((resp) => {
          const x = ((resp.timestamp - windowStart) / windowDuration) * tracksWidth;
          const y = tracksTopOffset + resp.trackIndex * (trackHeight + trackGap) + trackHeight / 2;
          const rectWidth = (resp.duration / windowDuration) * tracksWidth;
          const isActive = activeRectIds.includes(resp.id);
          const isHovered = hoveredResponseId === resp.id;
          return (
            <React.Fragment key={resp.id}>
              <Rect
                x={x}
                y={y - 14}
                width={rectWidth}
                height={28}
                fill={isActive ? "#ff9800" : "#ffeb3b"}
                stroke={isHovered ? "#00e5ff" : isActive ? "#ff1744" : "#333"}
                strokeWidth={isHovered ? 4 : 2}
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
  );
};

export default TracksColumn; 