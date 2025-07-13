import React from "react";
import { Group, Line } from "react-konva";
import KonvaTimeSeriesPlot from "./KonvaTimeSeriesPlot";

export interface WindowedKonvaTimeSeriesPlotProps {
  yValues: number[];
  xValues?: number[];
  eventTimes?: number[];
  windowStart: number;
  windowDuration: number;
  playhead?: number;
  width?: number;
  height?: number;
  color?: string;
  markerColor?: string;
  playheadColor?: string;
  showAxes?: boolean;
  showTicks?: boolean;
  padX?: number;
  padY?: number;
  /** Vertical offset for the plot within the parent (in px, default 0) */
  yOffset?: number;
}

const WindowedKonvaTimeSeriesPlot: React.FC<WindowedKonvaTimeSeriesPlotProps> = ({
  yValues,
  xValues,
  eventTimes,
  windowStart,
  windowDuration,
  playhead,
  width = 800,
  height = 80,
  color = "#4fc3f7",
  markerColor = "red",
  playheadColor = "#ff1744",
  showAxes = true,
  showTicks = true,
  padX = 12,
  padY = 6,
  yOffset = 0,
}) => {
  // Windowing logic
  let startIdx = 0, endIdx = yValues.length;
  let windowedY: number[] = [];
  let windowedX: number[] | undefined = undefined;
  let windowedEvents: number[] | undefined = undefined;
  if (xValues && xValues.length === yValues.length) {
    startIdx = xValues.findIndex((x) => x >= windowStart);
    endIdx = xValues.findIndex((x) => x > windowStart + windowDuration);
    if (startIdx === -1) startIdx = 0;
    if (endIdx === -1) endIdx = yValues.length;
    windowedY = yValues.slice(startIdx, endIdx);
    windowedX = xValues.slice(startIdx, endIdx);
    if (eventTimes) {
      windowedEvents = eventTimes.filter((t) => t >= windowStart && t <= windowStart + windowDuration);
    }
  } else {
    startIdx = Math.max(0, Math.floor(windowStart));
    endIdx = Math.min(yValues.length, Math.ceil(windowStart + windowDuration));
    windowedY = yValues.slice(startIdx, endIdx);
    if (eventTimes) {
      windowedEvents = eventTimes.filter((i) => i >= startIdx && i < endIdx).map((i) => i - startIdx);
    }
  }
  // Playhead X (in px)
  let playheadX: number | undefined = undefined;
  if (typeof playhead === "number" && windowedY.length > 1) {
    if (windowedX) {
      const i = windowedX.reduce((bestIdx, t, j) => Math.abs(t - playhead) < Math.abs(windowedX[bestIdx] - playhead) ? j : bestIdx, 0);
      playheadX = padX + (i / (windowedY.length - 1)) * (width - 2 * padX);
    } else {
      const i = Math.max(0, Math.min(windowedY.length - 1, Math.round(playhead - startIdx)));
      playheadX = padX + (i / (windowedY.length - 1)) * (width - 2 * padX);
    }
  }
  return (
    <Group>
      <KonvaTimeSeriesPlot
        yValues={windowedY}
        xValues={windowedX}
        eventTimes={windowedEvents}
        width={width}
        height={height}
        color={color}
        markerColor={markerColor}
        showAxes={showAxes}
        showTicks={showTicks}
        padX={padX}
        padY={padY}
        yOffset={yOffset}
      />
      {/* Playhead overlay as a Konva Line */}
      {typeof playheadX === "number" && (
        <Line
          points={[playheadX, yOffset, playheadX, yOffset + height]}
          stroke={playheadColor}
          strokeWidth={2}
          dash={[8, 8]}
        />
      )}
    </Group>
  );
};

export default WindowedKonvaTimeSeriesPlot;
export { WindowedKonvaTimeSeriesPlot }; 