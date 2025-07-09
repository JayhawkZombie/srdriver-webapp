import React from "react";
import { Group, Rect, Line } from "react-konva";
import WindowedKonvaTimeSeriesPlot from "./WindowedKonvaTimeSeriesPlot";

/**
 * Props for the Track component.
 */
export interface TrackProps {
  y: number; // Top y position of the track in the timeline
  width: number;
  height: number;
  trackIndex: number;
  isTrackAssigned: boolean;
  fill: string;
  selectedBandIdx: number;
  bandConfigs: { name: string; color: string }[];
  bandResults: any[];
  onSelectBand: (trackIdx: number, bandIdx: number) => void;
  plotPadX?: number;
  plotPadY?: number;
  windowStart: number;
  windowDuration: number;
  playhead?: number;
  // Optionally, pass in the playhead position, etc.
}

const Track: React.FC<TrackProps> = ({
  y,
  width,
  height,
  trackIndex,
  isTrackAssigned,
  fill,
  selectedBandIdx,
  bandConfigs,
  bandResults,
  onSelectBand,
  plotPadX = 12,
  plotPadY = 6,
  windowStart,
  windowDuration,
  playhead,
}) => {
  const band = bandResults && bandResults[selectedBandIdx];
  const bandConfig = bandConfigs && bandConfigs[selectedBandIdx];
  // Center the plot vertically in the track
  const plotHeight = height - 2 * plotPadY;
  const plotY = y + plotPadY;
  return (
    <Group>
      {/* Track background */}
      <Rect
        x={0}
        y={y}
        width={width}
        height={height}
        fill={fill}
        cornerRadius={6}
        opacity={isTrackAssigned ? 1 : 0.7}
        stroke="#444"
        strokeWidth={2}
      />
      {/* Band selector (row of colored circles) */}
      {bandConfigs && bandConfigs.length > 0 && (
        <Group x={8} y={y + 8}>
          {bandConfigs.map((band, bandIdx) => (
            <Rect
              key={bandIdx}
              x={bandIdx * 28}
              y={0}
              width={20}
              height={20}
              fill={band.color}
              opacity={selectedBandIdx === bandIdx ? 1 : 0.4}
              stroke={selectedBandIdx === bandIdx ? "#fff" : "none"}
              strokeWidth={2}
              cornerRadius={10}
              onClick={e => {
                e.cancelBubble = true;
                onSelectBand(trackIndex, bandIdx);
              }}
              onTap={e => {
                e.cancelBubble = true;
                onSelectBand(trackIndex, bandIdx);
              }}
              perfectDrawEnabled={false}
            />
          ))}
        </Group>
      )}
      {/* Plot underlay for this track, centered vertically and windowed */}
      {band && band.detectionFunction && band.times && (
        <WindowedKonvaTimeSeriesPlot
          yValues={band.detectionFunction}
          xValues={band.times}
          eventTimes={band.events ? band.events.map((e: { time: number; strength?: number }) => e.time) : undefined}
          width={width}
          height={plotHeight}
          color={bandConfig?.color || "#4fc3f7"}
          markerColor="yellow"
          showAxes={false}
          showTicks={false}
          padX={plotPadX}
          padY={0}
          yOffset={plotY}
          windowStart={windowStart}
          windowDuration={windowDuration}
          playhead={playhead}
        />
      )}
      {/* Midline */}
      <Line
        points={[
          0,
          y + height / 2,
          width,
          y + height / 2,
        ]}
        stroke="#333"
        strokeWidth={1}
        dash={[4, 4]}
      />
      {/* Track border bottom (except last) - parent should handle if needed */}
    </Group>
  );
};

export default Track; 