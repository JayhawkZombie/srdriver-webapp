import React from "react";
import { Stage, Layer, Line, Star, Text } from "react-konva";

interface TimeSeriesPlotWithEventsProps {
  yValues: number[];
  xValues?: number[]; // If not provided, use index
  eventTimes?: number[]; // Times (or indices) to mark with stars
  width?: number;
  height?: number;
  color?: string;
  markerColor?: string;
  showAxes?: boolean;
  showTicks?: boolean;
}

const TimeSeriesPlotWithEvents: React.FC<TimeSeriesPlotWithEventsProps> = ({
  yValues,
  xValues,
  eventTimes,
  width = 800,
  height = 80,
  color = "#4fc3f7",
  markerColor = "red",
  showAxes = true,
  showTicks = true,
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
  // Axes and ticks
  const axisColor = '#bbb';
  const tickLength = 6;
  const fontSize = 12;
  const yTicks = showTicks ? [0, 0.5, 1] : [];
  // X ticks: 5 evenly spaced
  const xTicks = showTicks ? Array.from({length: 5}, (_, i) => i / 4) : [];
  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Y axis */}
        {showAxes && (
          <Line points={[40, 0, 40, height - 20]} stroke={axisColor} strokeWidth={1} />
        )}
        {/* X axis */}
        {showAxes && (
          <Line points={[40, height - 20, width, height - 20]} stroke={axisColor} strokeWidth={1} />
        )}
        {/* Y ticks and labels */}
        {showTicks && yTicks.map((v, i) => (
          <>
            <Line
              key={`ytick-${i}`}
              points={[40 - tickLength, (1 - v) * (height - 20), 40, (1 - v) * (height - 20)]}
              stroke={axisColor}
              strokeWidth={1}
            />
            <Text
              key={`ylabel-${i}`}
              x={0}
              y={(1 - v) * (height - 20) - fontSize / 2}
              text={v.toString()}
              fontSize={fontSize}
              fill={axisColor}
              width={38}
              align="right"
            />
          </>
        ))}
        {/* X ticks and labels */}
        {showTicks && xTicks.map((t, i) => {
          const x = 40 + t * (width - 40);
          let label = '';
          if (xValues && xValues.length > 1) {
            const idx = Math.round(t * (xValues.length - 1));
            label = xValues[idx].toFixed(2);
          } else {
            const idx = Math.round(t * (yValues.length - 1));
            label = idx.toString();
          }
          return (
            <>
              <Line
                key={`xtick-${i}`}
                points={[x, height - 20, x, height - 20 + tickLength]}
                stroke={axisColor}
                strokeWidth={1}
              />
              <Text
                key={`xlabel-${i}`}
                x={x - 20}
                y={height - 20 + tickLength + 2}
                text={label}
                fontSize={fontSize}
                fill={axisColor}
                width={40}
                align="center"
              />
            </>
          );
        })}
        {/* Data line */}
        <Line points={points.map((v, i) => i % 2 === 0 ? v + 40 : v)} stroke={color} strokeWidth={2} />
        {/* Event markers */}
        {eventIndices.map((i, idx) => (
          <Star
            key={idx}
            x={xs[i] + 40}
            y={height - 20 - norm[i] * (height - 22)}
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