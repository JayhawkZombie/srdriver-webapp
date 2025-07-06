import React from "react";
import { Stage, Layer, Line, Star } from "react-konva";

interface TimeSeriesPlotWithEventsProps {
  yValues: number[];
  xValues?: number[]; // If not provided, use index
  eventTimes?: number[]; // Times (or indices) to mark with stars
  width?: number;
  height?: number;
  color?: string;
  markerColor?: string;
}

const TimeSeriesPlotWithEvents: React.FC<TimeSeriesPlotWithEventsProps> = ({
  yValues,
  xValues,
  eventTimes,
  width = 800,
  height = 80,
  color = "#4fc3f7",
  markerColor = "red",
}) => {
  if (!yValues || yValues.length === 0) return null;
  // Normalize Y
  const min = Math.min(...yValues);
  const max = Math.max(...yValues);
  const norm = max - min > 0 ? yValues.map((v) => (v - min) / (max - min)) : yValues.map(() => 0.5);
  // X axis
  const xs = xValues && xValues.length === yValues.length
    ? xValues.map((x) => (x - xValues[0]) / (xValues[xValues.length - 1] - xValues[0]) * width)
    : yValues.map((_, i) => (i / (yValues.length - 1)) * width);
  // Line points
  const points = norm.map((v, i) => [xs[i], height - v * (height - 2) - 1]).flat();
  // Event marker indices
  let eventIndices: number[] = [];
  if (eventTimes && eventTimes.length > 0) {
    if (xValues && xValues.length === yValues.length) {
      // For each event time, find closest xValue
      eventIndices = eventTimes.map((et) => xValues.reduce((bestIdx, t, j) => Math.abs(t - et) < Math.abs(xValues[bestIdx] - et) ? j : bestIdx, 0));
    } else {
      // Assume eventTimes are indices
      eventIndices = eventTimes.map((et) => Math.round(et)).filter((i) => i >= 0 && i < yValues.length);
    }
  }
  return (
    <Stage width={width} height={height}>
      <Layer>
        <Line points={points} stroke={color} strokeWidth={2} />
        {eventIndices.map((i, idx) => (
          <Star
            key={idx}
            x={xs[i]}
            y={height - norm[i] * (height - 2) - 1}
            numPoints={5}
            innerRadius={4}
            outerRadius={8}
            fill={markerColor}
            stroke="black"
            strokeWidth={1}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default TimeSeriesPlotWithEvents; 