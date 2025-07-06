import React from "react";
import TimeSeriesPlotWithEvents from "./TimeSeriesPlotWithEvents";

export interface WindowedTimeSeriesPlotProps {
  yValues: number[];
  xValues?: number[];
  eventTimes?: number[];
  windowStart: number; // in same units as xValues (seconds or index)
  windowDuration: number; // in same units as xValues (seconds or index)
  playhead?: number; // in same units as xValues (seconds or index)
  width?: number;
  height?: number;
  color?: string;
  markerColor?: string;
  playheadColor?: string;
  showAxes?: boolean;
  showTicks?: boolean;
}

const WindowedTimeSeriesPlot: React.FC<WindowedTimeSeriesPlotProps> = ({
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
}) => {
  // Determine windowed indices
  let startIdx = 0, endIdx = yValues.length;
  let windowedY: number[] = [];
  let windowedX: number[] | undefined = undefined;
  let windowedEvents: number[] | undefined = undefined;
  if (xValues && xValues.length === yValues.length) {
    // Find indices within windowStart to windowStart+windowDuration
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
    // Use indices as x axis
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
      // Find closest x in windowedX
      const i = windowedX.reduce((bestIdx, t, j) => Math.abs(t - playhead) < Math.abs(windowedX[bestIdx] - playhead) ? j : bestIdx, 0);
      playheadX = (i / (windowedY.length - 1)) * width;
    } else {
      // Use index
      const i = Math.max(0, Math.min(windowedY.length - 1, Math.round(playhead - startIdx)));
      playheadX = (i / (windowedY.length - 1)) * width;
    }
  }
  return (
    <div style={{ position: "relative", width, height }}>
      <TimeSeriesPlotWithEvents
        yValues={windowedY}
        xValues={windowedX}
        eventTimes={windowedEvents}
        width={width}
        height={height}
        color={color}
        markerColor={markerColor}
        showAxes={showAxes}
        showTicks={showTicks}
      />
      {/* Playhead overlay using absolute div */}
      {typeof playheadX === "number" && (
        <div style={{ position: "absolute", left: playheadX, top: 0, width: 2, height, background: playheadColor, zIndex: 2 }} />
      )}
    </div>
  );
};

export default WindowedTimeSeriesPlot;
export { WindowedTimeSeriesPlot }; 