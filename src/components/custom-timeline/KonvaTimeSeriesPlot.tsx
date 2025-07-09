import React from "react";
import { Group, Line, Star, Text } from "react-konva";

interface KonvaTimeSeriesPlotProps {
  yValues: number[];
  xValues?: number[]; // If not provided, use index
  eventTimes?: number[]; // Times (or indices) to mark with stars
  width?: number;
  height?: number;
  color?: string;
  markerColor?: string;
  showAxes?: boolean;
  showTicks?: boolean;
  xOffset?: number;
  yOffset?: number;
  /** Horizontal padding inside the plot area (in px, default 12) */
  padX?: number;
  /** Vertical padding inside the plot area (in px, default 6) */
  padY?: number;
}

const KonvaTimeSeriesPlot: React.FC<KonvaTimeSeriesPlotProps> = ({
  yValues,
  xValues,
  eventTimes,
  width = 800,
  height = 80,
  color = "#4fc3f7",
  markerColor = "red",
  showAxes = true,
  showTicks = true,
  xOffset = 0,
  yOffset = 0,
  padX = 12,
  padY = 6,
}) => {
  if (!yValues || yValues.length === 0) return null;
  // Normalize Y
  const min = Math.min(...yValues);
  const max = Math.max(...yValues);
  const norm = max - min > 0 ? yValues.map((v) => (v - min) / (max - min)) : yValues.map(() => 0.5);
  // X axis
  const xs = xValues && xValues.length === yValues.length
    ? xValues.map((x) => padX + (x - xValues[0]) / (xValues[xValues.length - 1] - xValues[0]) * (width - 2 * padX))
    : yValues.map((_, i) => padX + (i / (yValues.length - 1)) * (width - 2 * padX));
  // Line points
  const points = norm.map((v, i) => [xs[i], padY + (1 - v) * (height - 2 * padY)]).flat();
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
    <Group x={xOffset} y={yOffset}>
      {/* Y axis */}
      {showAxes && (
        <Line points={[padX, padY, padX, height - padY]} stroke={axisColor} strokeWidth={1} />
      )}
      {/* X axis */}
      {showAxes && (
        <Line points={[padX, height - padY, width - padX, height - padY]} stroke={axisColor} strokeWidth={1} />
      )}
      {/* Y ticks and labels */}
      {showTicks && yTicks.map((v, i) => [
        <Line
          key={`ytick-${i}`}
          points={[padX - tickLength, padY + (1 - v) * (height - 2 * padY), padX, padY + (1 - v) * (height - 2 * padY)]}
          stroke={axisColor}
          strokeWidth={1}
        />,
        <Text
          key={`ylabel-${i}`}
          x={0}
          y={padY + (1 - v) * (height - 2 * padY) - fontSize / 2}
          text={v.toString()}
          fontSize={fontSize}
          fill={axisColor}
          width={padX - 2}
          align="right"
        />
      ])}
      {/* X ticks and labels */}
      {showTicks && xTicks.map((t, i) => {
        const x = padX + t * (width - 2 * padX);
        let label = '';
        if (xValues && xValues.length > 1) {
          const idx = Math.round(t * (xValues.length - 1));
          label = xValues[idx].toFixed(2);
        } else {
          const idx = Math.round(t * (yValues.length - 1));
          label = idx.toString();
        }
        return [
          <Line
            key={`xtick-${i}`}
            points={[x, height - padY, x, height - padY + tickLength]}
            stroke={axisColor}
            strokeWidth={1}
          />,
          <Text
            key={`xlabel-${i}`}
            x={x - 20}
            y={height - padY + tickLength + 2}
            text={label}
            fontSize={fontSize}
            fill={axisColor}
            width={40}
            align="center"
          />
        ];
      })}
      {/* Data line */}
      <Line points={points} stroke={color} strokeWidth={2} />
      {/* Event markers */}
      {eventIndices.map((i, idx) => (
        <Star
          key={idx}
          x={xs[i]}
          y={padY + (1 - norm[i]) * (height - 2 * padY)}
          numPoints={5}
          innerRadius={4}
          outerRadius={8}
          fill={markerColor}
          stroke="black"
          strokeWidth={1}
        />
      ))}
    </Group>
  );
};

export default KonvaTimeSeriesPlot; 